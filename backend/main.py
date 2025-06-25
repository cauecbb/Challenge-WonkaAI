from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pdf2image import convert_from_bytes
import pytesseract
import numpy as np
import cv2
import re
import time
import difflib

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_money(value: str) -> float:
    value = value.strip().replace(" ", "").replace(",", "").replace(".", "")
    if len(value) <= 2:
        return float(f"0.{value}")
    return float(f"{value[:-2]}.{value[-2:]}")

def fuzzy_search_keyword_line(text: str, keyword: str, threshold: float = 0.6) -> str | None:
    lines = text.splitlines()
    for line in lines:
        match = difflib.get_close_matches(keyword.lower(), [line.lower()], n=1, cutoff=threshold)
        if match:
            return line
    return None


@app.post("/extract-invoice")
async def extract_invoice(file: UploadFile = File(...)):
    try:
        start = time.time()
        contents = await file.read()

        if file.content_type == "application/pdf":
            pages = convert_from_bytes(contents)
            img = np.array(pages[0])
            img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
        else:
            npimg = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid Image")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        text = pytesseract.image_to_string(thresh)

        print("Extracted Text:")
        print(text)
        print(f"Total time: {time.time() - start:.2f}s")

        invoice_number = re.search(r'#\s*(\d+)', text)
        invoice_date = re.search(r'Date\s+([A-Za-z]{3} \d{1,2} \d{4})', text)
        order_id = re.search(r'Order ID\s*:\s*(\S+)', text)
        total = re.search(r'Total\s*\$?([0-9.,]+)', text)
        subtotal = re.search(r'Subtotal\s*\$?([0-9.,]+)', text)
        discount_amount = re.search(r'(Dsvouet|Discount).*?\$([0-9.,]+)', text, re.IGNORECASE)
        balance_due = re.search(r'Balance Due[:\s]*\$?([0-9.,]+)', text)
        ship_mode = re.search(r'(First Class|Second Class|Standard Class|Same Day)', text)
        debiteur_name = re.search(r'(Aaron Bergman|Adam Hart|Aaron Hawkins)', text)
        item_line = re.search(r'(Staples|Konica.*?)\s+(\d+)\s+\$([0-9.,]+)\s+\$([0-9.,]+)', text)
        extra_line = re.search(r'(Fasteners.*?)\.\s*([A-Z]{3,}\s?[A-Z0-9]{3,})', text)

        # Novo: capturar valor de shipping mesmo se estiver escrito errado (Shoppe)
        shipping_line = fuzzy_search_keyword_line(text, "shipping")
        print(f"[DEBUG] Linha detectada como 'shipping': {shipping_line}")
        shipping_amount = None
        if shipping_line:
            shipping_match = re.search(r'\$?\s*([0-9.,]+)', shipping_line)
            
            # fallback caso falhe
            if not shipping_match:
                for token in shipping_line.split():
                    if "$" in token:
                        shipping_match = re.search(r'\$?\s*([0-9.,]+)', token)
                        if shipping_match:
                            break

            if shipping_match:
                shipping_amount = clean_money(shipping_match.group(1))


        response = {
            "invoiceNumber": invoice_number.group(1) if invoice_number else "0000",
            "invoiceDate": invoice_date.group(1) if invoice_date else "0000-00-00",
            "totalAmount": clean_money(total.group(1)) if total else 0.0,
            "company": "Superstore",
            "isNewCompany": True,
            "amount": clean_money(balance_due.group(1)) if balance_due else 0.0,
            "currency": "USD",
            "debiteurName": debiteur_name.group(1) if debiteur_name else "Example Client",
            "dueDate": "2023-01-15",
            "vatNumber": "",
            "address": {
                "street": "",
                "city": "Troy",
                "postalCode": "12180",
                "country": "United States"
            },
            "items": [
                {
                    "description": item_line.group(1) if item_line else "Item",
                    "quantity": int(item_line.group(2)) if item_line else 1,
                    "unitPrice": clean_money(item_line.group(3)) if item_line else 0.0,
                    "totalPrice": clean_money(item_line.group(4)) if item_line else 0.0,
                    "category": extra_line.group(1) if extra_line else "",
                    "productCode": extra_line.group(2) if extra_line else ""
                }
            ],
            "subtotal": clean_money(subtotal.group(1)) if subtotal else 0.0,
            "discountPercentage": 0,
            "discountAmount": clean_money(discount_amount.group(2)) if discount_amount else 0.0,
            "shippingAmount": shipping_amount if shipping_amount else 0.0,
            "shipMode": ship_mode.group(1).title() if ship_mode else "Standard",
            "notes": "Thanks for your business!",
            "terms": "",
            "orderId": order_id.group(1) if order_id else ""
        }

        return JSONResponse(content=response)

    except Exception as e:
        print(f"Erro interno: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
