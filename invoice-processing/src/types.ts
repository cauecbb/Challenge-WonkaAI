// Define the report information label interface
interface ReportInformationLabel {
  report_id: string;
  information_label_id: string;
  correct: boolean | undefined;
  comment: string;
}

// Define the report information label with images interface
export interface ReportInformationLabelWithImages {
  id?: string;
  // Add all required properties based on your backend schema
  title?: string;
  description?: string;
  createdAt?: string;
  // Add other relevant fields from your backend model
  images?: string[]; // URLs of images
  report_information_labels?: ReportInformationLabel[];
  // You can expand this based on the actual structure from the backend
} 