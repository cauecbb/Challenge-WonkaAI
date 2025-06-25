// Mock client service for assessment purposes
// SuperStore's client/customer management system
// In a real implementation, this would call a backend API

export interface Client {
  id: string;
  name: string;
  address: string;
  firstDate: string; // First order/registration date
  amountDue: number;
  numberOfInvoices: number;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  description: string;
  isPaid: boolean;
  clientId: string;
}

// Mock function to simulate fetching all clients
export const getAllClients = async (): Promise<Client[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return [];
};

// Mock function to simulate searching/filtering clients
export const searchClients = async (searchTerm: string): Promise<Client[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [];
};

// Mock function to get client by ID
export const getClientById = async (clientId: string): Promise<Client | null> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return null;  
};

// Mock function to get transactions for a specific client
export const getClientTransactions = async (clientId: string): Promise<Transaction[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return [];
};

// Mock function to mark an invoice as paid
export const markInvoiceAsPaid = async (invoiceId: string): Promise<{ success: boolean; message: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  
  
  // Simulate success response
  return {
    success: true,
    message: `Invoice ${invoiceId} has been marked as paid successfully.`
  };
};

export default {
  getAllClients,
  searchClients,
  getClientById,
  getClientTransactions,
  markInvoiceAsPaid
}; 