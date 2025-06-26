from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pdf2image import convert_from_bytes
import pytesseract
import numpy as np
import cv2
import re
import time
import difflib
from sqlalchemy.orm import Session
from database import get_db
import crud, schemas
from sqlalchemy.exc import IntegrityError

app = FastAPI()

# CORS allows front end access
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


def parse_float(val: str) -> float:
    if not val:
        return 0.0
    val = val.replace('$', '').replace(' ', '').strip()

    if val.count('.') > 1:
        parts = val.split('.')
        val = ''.join(parts[:-1]) + '.' + parts[-1]

    val = val.replace(',', '.')
    try:
        return float(val)
    except Exception:
        return 0.0

# main app
@app.post("/extract-invoice")
async def extract_invoice(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        start = time.time()
        contents = await file.read()

        # verify archive type
        if file.content_type == "application/pdf":
            pages = convert_from_bytes(contents)
            img = np.array(pages[0])
            img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
        else:
            npimg = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Imagem inválida.")

        # computer vision
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
        debiteur_name = re.search(r'(Aaron Hawkins|Aaron Bergman|Adam Hart)', text)  
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
        # print(f"[DEBUG] Linha final detectada como shipping: {shipping_line}")
        # print(f"[DEBUG] Shipping amount extraído: {shipping_amount}")

        # helps extract
        lines = text.splitlines()
        name, city, country, ship_mode_val = "", "", "", ""
        items = []
        for idx, line in enumerate(lines):
            # ship mode
            if re.search(r'Class$', line):
                parts = line.strip().split()
                if len(parts) >= 2:
                    ship_mode_val = parts[-2] + " " + parts[-1]  # ex: 'First Class'
            # bil to
            if "Bl To" in line or "Bill To" in line or "Srp To" in line:
                for offset in range(1, 6):
                    if idx + offset < len(lines):
                        possible_name = lines[idx + offset].strip()
                        if any(x in possible_name for x in ["Ship Mode", "Shp Mode", "Standard", "First", "Second", "Class"]):
                            continue
                        if re.match(r'^[A-Z][a-zA-Z]+ [A-Z][a-zA-Z]+$', possible_name):
                            name = possible_name
                            # address
                            if idx + offset + 1 < len(lines):
                                city_line = lines[idx + offset + 1].strip()
                                if "," in city_line:
                                    city = city_line.split(",")[0]
                            if idx + offset + 2 < len(lines):
                                country_line = lines[idx + offset + 2].strip()
                                if country_line and not "Balance Due" in country_line:
                                    country = country_line
                            break
                # fallback
                if not name:
                    for offset in range(1, 6):
                        if idx + offset < len(lines):
                            possible_name = lines[idx + offset].strip()
                            if any(x in possible_name for x in ["Ship Mode", "Shp Mode", "Standard", "First", "Second", "Class"]):
                                continue
                            name = possible_name
                            break
                break
            # search for unit and total
            match = re.search(r'^(.*?)(\d+)\s*\$([\d.,]+)\s*\$([\d.,]+)$', line)
            if match:
                description = match.group(1).strip()
                quantity = int(match.group(2))
                unit_price = parse_float(match.group(3))
                total_price = parse_float(match.group(4))
                category = ""
                product_code = ""
                if idx + 1 < len(lines):
                    cat_match = re.search(r'([A-Za-z\s.]+)[.,]\s*([A-Z]{3,}\s?[A-Z0-9-]+)', lines[idx + 1])
                    if cat_match:
                        category = cat_match.group(1).strip()
                        product_code = cat_match.group(2).strip()
                items.append({
                    "description": description or "",
                    "quantity": quantity,
                    "unitPrice": unit_price,
                    "totalPrice": total_price,
                    "category": category,
                    "productCode": product_code
                })
        if not items:
            items = [{
                "description": "",
                "quantity": 0,
                "unitPrice": 0.0,
                "totalPrice": 0.0,
                "category": "",
                "productCode": ""
            }]

        # JSON for response
        response = {
            "invoiceNumber": invoice_number.group(1) if invoice_number else "0000",
            "invoiceDate": invoice_date.group(1) if invoice_date else "0000-00-00",
            "totalAmount": parse_float(total.group(1)) if total else 0.0,
            "company": "Superstore",
            "isNewCompany": True,
            "amount": parse_float(balance_due.group(1)) if balance_due else 0.0,
            "currency": "USD",
            "debiteurName": name if name else "Cliente Exemplo",
            "dueDate": "2023-01-15",
            "vatNumber": "",
            "address": {
                "street": "",
                "city": city if city else "",
                "postalCode": "",
                "country": country if country else ""
            },
            "items": items,
            "subtotal": parse_float(subtotal.group(1)) if subtotal else 0.0,
            "discountPercentage": 0,
            "discountAmount": parse_float(discount_amount.group(2)) if discount_amount else 0.0,
            "shippingAmount": shipping_amount,
            "shipMode": ship_mode_val if ship_mode_val else (ship_mode.group(1) if ship_mode else "Standard"),
            "notes": "Thanks for your business!",
            "terms": "",
            "orderId": order_id.group(1) if order_id else ""
        }
        invoice_data = schemas.InvoiceCreate(**response)
        try:
            created_invoice = crud.create_invoice(db, invoice_data)
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=409, detail="Invoice number already exists.")
        return JSONResponse(content=invoice_to_schema(created_invoice).dict())

    except Exception as e:
        print(f"internal error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def invoice_to_schema(invoice):
    return schemas.Invoice(
        id=invoice.id,
        invoiceNumber=invoice.invoice_number,
        invoiceDate=invoice.invoice_date,
        totalAmount=invoice.total_amount,
        company=getattr(invoice, 'company', 'Superstore'),
        isNewCompany=True,
        amount=invoice.amount,
        currency=invoice.currency,
        debiteurName=invoice.debiteur_name,
        dueDate=invoice.due_date,
        vatNumber=invoice.vat_number,
        address={
            "street": invoice.street or "",
            "city": invoice.city or "",
            "postalCode": invoice.postal_code or "",
            "country": invoice.country or ""
        },
        items=[
            {
                "description": item.description,
                "quantity": item.quantity,
                "unitPrice": item.unit_price,
                "totalPrice": item.total_price,
                "category": item.category,
                "productCode": item.product_code
            }
            for item in invoice.items
        ],
        subtotal=invoice.subtotal,
        discountPercentage=invoice.discount_percentage,
        discountAmount=invoice.discount_amount,
        shippingAmount=invoice.shipping_amount,
        shipMode=invoice.ship_mode,
        notes=invoice.notes,
        terms=invoice.terms,
        orderId=invoice.order_id
    )
