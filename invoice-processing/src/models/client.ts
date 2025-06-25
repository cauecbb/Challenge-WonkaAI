export interface Client {
  id: string;
  name: string;
}

export interface ClientCreate {
  name: string;
}

export interface ClientUpdate {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface ClientRequirements {
  id: string;
  name: string;
  description?: string;
  rules?: string;
  source?: string;
  client_id: string;
  product_id?: string;
  document_id?: string;
} 

export interface ClientRequirementsUpdate {
  name: string;
  description?: string;
  rules?: string;
  client_id: string;
  product_id?: string;
  document_id?: string;
}

export interface ClientRequirementsCreate {
  name: string;
  description?: string | null;
  rules?: string | null;
  client_id: string;
  product_id?: string | null;
}