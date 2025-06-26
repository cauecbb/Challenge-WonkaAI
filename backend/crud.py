from sqlalchemy.orm import Session
import models, schemas

def create_invoice(db: Session, invoice_data: schemas.InvoiceCreate):
    db_invoice = models.Invoice(
        invoice_number=invoice_data.invoiceNumber,
        invoice_date=invoice_data.invoiceDate,
        total_amount=invoice_data.totalAmount,
        amount=invoice_data.amount,
        currency=invoice_data.currency,
        debiteur_name=invoice_data.debiteurName,
        due_date=invoice_data.dueDate,
        vat_number=invoice_data.vatNumber,
        street=invoice_data.address.street,
        city=invoice_data.address.city,
        postal_code=invoice_data.address.postalCode,
        country=invoice_data.address.country,
        subtotal=invoice_data.subtotal,
        discount_percentage=invoice_data.discountPercentage,
        discount_amount=invoice_data.discountAmount,
        shipping_amount=invoice_data.shippingAmount,
        ship_mode=invoice_data.shipMode,
        notes=invoice_data.notes,
        terms=invoice_data.terms,
        order_id=invoice_data.orderId
    )
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    for item in invoice_data.items:
        db_item = models.Item(
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unitPrice,
            total_price=item.totalPrice,
            category=item.category,
            product_code=item.productCode,
            invoice_id=db_invoice.id
        )
        db.add(db_item)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

def get_invoices(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Invoice).offset(skip).limit(limit).all() 