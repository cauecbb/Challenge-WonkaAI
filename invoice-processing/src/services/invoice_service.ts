// Mock invoice service for assessment purposes
// In a real implementation, this would send the PDF to a backend service

export interface InvoiceData {
  company: string;
  isNewCompany: boolean;
  amount: number;
  currency: string;
  debiteurName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  vatNumber?: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    category?: string;
    productCode?: string;
  }>;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  shipMode: string;
  notes?: string;
  terms?: string;
}

// Mock function to simulate invoice data extraction
export const extractInvoiceData = async (file: File): Promise<InvoiceData> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return mock data based on the SuperStore invoice
  const mockInvoiceData: InvoiceData = {
    company: "SuperStore",
    isNewCompany: false, // Established business
    amount: 1796.80,
    currency: "USD",
    debiteurName: "John Castell",
    invoiceNumber: "#29555",
    invoiceDate: "Feb 05 2013",
    dueDate: "Mar 07 2013", // Assuming 30 days payment terms
    vatNumber: "SS-2013-29555", // Generated based on invoice pattern
    address: {
      street: "123 Main Street",
      city: "Bundaberg",
      postalCode: "4670",
      country: "Australia"
    },
    items: [
      {
        description: "Novimex Executive Leather Armchair, Adjustable",
        quantity: 2,
        unitPrice: 819.94,
        totalPrice: 1639.87,
        category: "Chairs, Furniture",
        productCode: "FUR-CH-5378"
      }
    ],
    subtotal: 1639.87,
    discountPercentage: 10,
    discountAmount: 163.99,
    shippingAmount: 320.92,
    totalAmount: 1796.80,
    shipMode: "First Class",
    notes: "Thanks for your business!",
    terms: "Order ID : IN-2013-JC157757-41310"
  };
  
  return mockInvoiceData;
};

// Mock function to simulate confirming/submitting invoice data
export const confirmInvoiceData = async (invoiceData: InvoiceData): Promise<{ success: boolean; message: string; confirmationId: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock successful confirmation response
  return {
    success: true,
    message: "Invoice data confirmed and processed successfully",
    confirmationId: `CONF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  };
};

export default {
  extractInvoiceData,
  confirmInvoiceData
}; 