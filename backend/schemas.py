from pydantic import BaseModel, Field
from typing import List

class Address(BaseModel):
    street: str = ""
    city: str = ""
    postalCode: str = ""
    country: str = ""

class Item(BaseModel):
    description: str
    quantity: int
    unitPrice: float = Field(alias="unitPrice")
    totalPrice: float = Field(alias="totalPrice")
    category: str = ""
    productCode: str = ""

class InvoiceCreate(BaseModel):
    invoiceNumber: str = Field(alias="invoiceNumber")
    invoiceDate: str = Field(alias="invoiceDate")
    totalAmount: float = Field(alias="totalAmount")
    company: str
    isNewCompany: bool
    amount: float
    currency: str
    debiteurName: str = Field(alias="debiteurName")
    dueDate: str
    vatNumber: str
    address: Address
    items: List[Item]
    subtotal: float
    discountPercentage: float
    discountAmount: float
    shippingAmount: float = Field(alias="shippingAmount")
    shipMode: str = Field(alias="shipMode")
    notes: str
    terms: str
    orderId: str = Field(alias="orderId")

    class Config:
        from_attributes = True
        populate_by_name = True

class Invoice(InvoiceCreate):
    id: int
    class Config:
        from_attributes = True 