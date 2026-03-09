export interface TransactionItem {
  id: string;
  stoneId: string;
  stoneName: string;
  stoneType: string;
  size: string;
  quantity: number;
  squareFeet: number;
  ratePerSqFt: number;
  amount: number;
  gstPercentage: number;
  gstAmount: number;
  lineTotal: number;
}

export interface SalesEntry {
  id: string;
  billNumber: string;
  customerName: string;
  salesDate: Date;
  items: TransactionItem[];
  subtotal: number;
  gstTotal: number;
  discountPercentage: number;
  discountAmount: number;
  grandTotal: number;
  notes?: string;
}

export interface PurchaseEntry {
  id: string;
  purchaseNumber: string;
  supplierName: string;
  purchaseDate: Date;
  items: TransactionItem[];
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  notes?: string;
}

export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  message: string;
}

export type VoucherType = 'receipt' | 'payment' | 'contra';

export interface VoucherEntry {
  id: string;
  voucherNumber: string;
  voucherType: VoucherType;
  partyName: string;
  ledgerName: string;
  amount: number;
  paymentMode: 'cash' | 'bank' | 'upi' | 'cheque';
  voucherDate: Date;
  note?: string;
}
