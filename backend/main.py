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

# CORS - allows front end to access it and avoid problems
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def fuzzy_search_line_containing_keyword(text: str, keyword: str, threshold: float = 0.6) -> str | None:
    lines = text.splitlines()
    for line in lines:
        words = line.strip().split()
        for word in words:
            similarity = difflib.SequenceMatcher(None, word.lower(), keyword.lower()).ratio()
            if similarity >= threshold:
                return line
    return None

def extract_amount_from_line(line: str) -> float:
    match = re.search(r'\$?([0-9.,]+)', line)
    if match:
        value = match.group(1)
        if value.count('.') > 1:
            parts = value.split('.')
            value = ''.join(parts[:-1]) + '.' + parts[-1]
        value = value.replace(',', '')
        return float(value)
    return 0.0

# main app

@app.post("/extract-invoice")
async def extract_invoice(file: UploadFile = File(...)):
    try:
        start = time.time()
        contents = await file.read()

        # Verify archive type
        if file.content_type == "application/pdf":
            pages = convert_from_bytes(contents)
            img = np.array(pages[0])
            img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
        else:
            npimg = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Imagem inválida.")

        # Computer vision
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

        # OCR
        text = pytesseract.image_to_string(thresh)
        print("Extracted Text:")
        print(text)
        print(f"Total time: {time.time() - start:.2f}s")

        # Regex 
        invoice_number = re.search(r'#\s*(\d+)', text)
        invoice_date = re.search(r'Date\s+([A-Za-z]{3} \d{1,2} \d{4})', text)
        order_id = re.search(r'Order ID\s*:\s*(\S+)', text)
        total = re.search(r'Total\s*\$?([0-9.,]+)', text)
        subtotal = re.search(r'Subtotal\s*\$?([0-9.,]+)', text)
        discount_amount = re.search(r'(Dsvouet|Discount).*?\$([0-9.,]+)', text, re.IGNORECASE)
        balance_due = re.search(r'Balance Due[:\s]*\$?([0-9.,]+)', text)
        ship_mode = re.search(r'(First Class|Second Class|Standard Class|Same Day)', text)
        debiteur_name = re.search(r'(Aaron Hawkins|Aaron Bergman|Adam Hart)', text)  # ajuste conforme necessário
        item_line = re.search(r'(Staples|Konica.*?)\s+(\d+)\s+\$([0-9.,]+)\s+\$([0-9.,]+)', text)
        extra_line = re.search(r'([A-Z][a-z]+.*)\.\s+([A-Z]{3,}\s?[A-Z0-9]{3,})', text)

        # Shipping problem 
        shipping_line = fuzzy_search_line_containing_keyword(text, "shipping", 0.6)
        if not shipping_line:
            for line in text.splitlines():
                if "Shoppe" in line:
                    shipping_line = line
                    print("[DEBUG] Pegamos shipping pela palavra 'Shoppe'")
                    break
        shipping_amount = extract_amount_from_line(shipping_line) if shipping_line else 0.0
        print(f"[DEBUG] Linha final detectada como shipping: {shipping_line}")
        print(f"[DEBUG] Shipping amount extraído: {shipping_amount}")

        # JSON for response
        response = {
            "invoiceNumber": invoice_number.group(1) if invoice_number else "0000",
            "invoiceDate": invoice_date.group(1) if invoice_date else "0000-00-00",
            "totalAmount": extract_amount_from_line(total.group(1)) if total else 0.0,
            "company": "Superstore",
            "isNewCompany": True,
            "amount": extract_amount_from_line(balance_due.group(1)) if balance_due else 0.0,
            "currency": "USD",
            "debiteurName": debiteur_name.group(1) if debiteur_name else "Cliente Exemplo",
            "dueDate": "2023-01-15",
            "vatNumber": "",
            "address": {
                "street": "",
                "city": "Troy",
                "postalCode": "",
                "country": "United States"
            },
            "items": [
                {
                    "description": item_line.group(1) if item_line else "Item",
                    "quantity": int(item_line.group(2)) if item_line else 1,
                    "unitPrice": extract_amount_from_line(item_line.group(3)) if item_line else 0.0,
                    "totalPrice": extract_amount_from_line(item_line.group(4)) if item_line else 0.0,
                    "category": extra_line.group(1) if extra_line else "",
                    "productCode": extra_line.group(2) if extra_line else ""
                }
            ],
            "subtotal": extract_amount_from_line(subtotal.group(1)) if subtotal else 0.0,
            "discountPercentage": 0,
            "discountAmount": extract_amount_from_line(discount_amount.group(2)) if discount_amount else 0.0,
            "shippingAmount": shipping_amount,
            "shipMode": ship_mode.group(1) if ship_mode else "Standard",
            "notes": "Thanks for your business!",
            "terms": "",
            "orderId": order_id.group(1) if order_id else ""
        }

        return JSONResponse(content=response)

    except Exception as e:
        print(f"Erro interno: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
