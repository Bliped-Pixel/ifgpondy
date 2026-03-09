export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  gstNumber?: string;
  registeredDate: Date;
  totalPurchases: number;
}
