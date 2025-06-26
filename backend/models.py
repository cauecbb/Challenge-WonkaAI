from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True)
    invoice_date = Column(String)
    total_amount = Column(Float)
    amount = Column(Float)
    currency = Column(String)
    debiteur_name = Column(String)
    due_date = Column(String)
    vat_number = Column(String)
    street = Column(String)
    city = Column(String)
    postal_code = Column(String)
    country = Column(String)
    subtotal = Column(Float)
    discount_percentage = Column(Float)
    discount_amount = Column(Float)
    shipping_amount = Column(Float)
    ship_mode = Column(String)
    notes = Column(String)
    terms = Column(String)
    order_id = Column(String)

    items = relationship("Item", back_populates="invoice", cascade="all, delete")

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    quantity = Column(Integer)
    unit_price = Column(Float)
    total_price = Column(Float)
    category = Column(String)
    product_code = Column(String)

    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    invoice = relationship("Invoice", back_populates="items")

# Criação automática das tabelas
from database import engine
Base.metadata.create_all(bind=engine) 