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

// Changed this part to remove mock data and actual call the backend api
// Function to extract invoice data
export const extractInvoiceData = async (file: File): Promise<InvoiceData> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("http://localhost:8000/extract-invoice", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Error to extract data");
  }

  const data = await response.json();
  return data;
};

// Mock function to simulate confirming/submitting invoice data
export const confirmInvoiceData = async (
  invoiceData: InvoiceData
): Promise<{ success: boolean; message: string; confirmationId: string }> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock successful confirmation response
  return {
    success: true,
    message: "Invoice data confirmed and processed successfully",
    confirmationId: `CONF-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`,
  };
};

export default {
  extractInvoiceData,
  confirmInvoiceData,
};
