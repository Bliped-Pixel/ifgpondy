export interface InvoiceItem {
  id: string;
  stoneId: string;
  stoneName: string;
  stoneType: string;
  size: string;
  quantity: number;
  unit: string;
  squareFeet: number;
  pricePerUnit: number;
  gstPercentage: number;
  gstAmount: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerGST?: string;
  items: InvoiceItem[];
  subtotal: number;
  gstPercentage: number;
  gstAmount: number;
  total: number;
  discount?: number;
  paymentStatus: 'pending' | 'paid' | 'partial';
  invoiceDate: Date;
  dueDate?: Date;
  notes?: string;
}
