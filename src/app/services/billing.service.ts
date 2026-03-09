import { Injectable, signal } from '@angular/core';
import { Invoice, InvoiceItem } from '../models/invoice.model';

const GST_RATES = {
  '5%': 5,
  '12%': 12,
  '18%': 18,
  '28%': 28
};

const STONE_TYPE_GST: { [key: string]: number } = {
  cuddapah: 5,
  granite: 18,
  marble: 18
};

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private invoices = signal<Invoice[]>([]);
  private invoiceCounter = signal(1000);

  invoices$ = this.invoices.asReadonly();

  generateInvoiceNumber(): string {
    const counter = this.invoiceCounter();
    this.invoiceCounter.set(counter + 1);
    return `INV-${new Date().getFullYear()}-${counter}`;
  }

  createInvoice(
    customerName: string,
    items: InvoiceItem[],
    discount: number = 0,
    notes?: string
  ): Invoice {
    const subtotal = items.reduce((sum, item) => sum + item.totalAmount, 0);
    const rawGstAmount = items.reduce((sum, item) => sum + item.gstAmount, 0);
    const discountAmount = (subtotal * discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const discountFactor = subtotal > 0 ? taxableAmount / subtotal : 0;
    const gstAmount = rawGstAmount * discountFactor;
    const gstPercentage = taxableAmount > 0 ? (gstAmount / taxableAmount) * 100 : 0;
    const total = taxableAmount + gstAmount;

    const invoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber: this.generateInvoiceNumber(),
      customerName,
      items,
      subtotal,
      gstPercentage,
      gstAmount,
      total,
      discount,
      paymentStatus: 'pending',
      invoiceDate: new Date(),
      notes
    };

    const current = this.invoices();
    this.invoices.set([...current, invoice]);
    return invoice;
  }

  updateInvoiceStatus(invoiceId: string, status: 'pending' | 'paid' | 'partial'): void {
    const current = this.invoices();
    const index = current.findIndex(inv => inv.id === invoiceId);
    if (index !== -1) {
      const updated = [...current];
      updated[index].paymentStatus = status;
      this.invoices.set(updated);
    }
  }

  deleteInvoice(invoiceId: string): void {
    const current = this.invoices();
    this.invoices.set(current.filter(inv => inv.id !== invoiceId));
  }

  getInvoice(invoiceId: string): Invoice | undefined {
    return this.invoices().find(inv => inv.id === invoiceId);
  }

  getInvoicesByCustomer(customerName: string): Invoice[] {
    return this.invoices().filter(inv => inv.customerName === customerName);
  }

  getInvoicesByDateRange(startDate: Date, endDate: Date): Invoice[] {
    return this.invoices().filter(
      inv =>
        new Date(inv.invoiceDate) >= startDate &&
        new Date(inv.invoiceDate) <= endDate
    );
  }

  getPendingInvoices(): Invoice[] {
    return this.invoices().filter(inv => inv.paymentStatus === 'pending');
  }

  calculateTotalRevenue(): number {
    return this.invoices()
      .filter(inv => inv.paymentStatus === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
  }

  getGSTRates(): { [key: string]: number } {
    return GST_RATES;
  }

  getGSTPercentageForStoneType(stoneType: string): number {
    const normalizedType = stoneType.trim().toLowerCase();
    return STONE_TYPE_GST[normalizedType] ?? 18;
  }

  exportInvoiceAsText(invoice: Invoice): string {
    let text = '==========================================\n';
    text += '              GRANITE BUSINESS\n';
    text += '==========================================\n\n';
    text += `Invoice Number: ${invoice.invoiceNumber}\n`;
    text += `Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}\n`;
    text += `Customer: ${invoice.customerName}\n`;
    if (invoice.customerPhone) text += `Phone: ${invoice.customerPhone}\n`;
    if (invoice.customerEmail) text += `Email: ${invoice.customerEmail}\n`;
    if (invoice.customerGST) text += `GST No: ${invoice.customerGST}\n`;
    text += '\n------------------------------------------\n';
    text += 'Item Details\n';
    text += '------------------------------------------\n\n';

    invoice.items.forEach(item => {
      text += `${item.stoneName}\n`;
      text += `  Size: ${item.size}\n`;
      text += `  Qty: ${item.quantity} ${item.unit} (${item.squareFeet.toFixed(2)} sq-ft) @ ₹${item.pricePerUnit} / sq-ft = ₹${item.totalAmount.toFixed(2)}\n`;
      text += `  GST (${item.gstPercentage}%): ₹${item.gstAmount.toFixed(2)}\n`;
    });

    text += '\n------------------------------------------\n';
    text += `Subtotal:          ₹${invoice.subtotal.toFixed(2)}\n`;
    if (invoice.discount) {
      text += `Discount (${invoice.discount}%):     -₹${((invoice.subtotal * invoice.discount) / 100).toFixed(2)}\n`;
    }
    text += `GST (${invoice.gstPercentage}%):         ₹${invoice.gstAmount.toFixed(2)}\n`;
    text += `------------------------------------------\n`;
    text += `Total:             ₹${invoice.total.toFixed(2)}\n`;
    text += '==========================================\n';

    return text;
  }
}
