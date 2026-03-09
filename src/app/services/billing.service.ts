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

const COMPANY_PROFILE = {
  name: 'INDO FRENCH GRANITES',
  gstin: '34ADYPA0680K1ZB',
  since: '1990',
  address: 'No.220/3H, Krishna Nagar Main Road, Lawspet, Puducherry - 605 008',
  contact: 'Shop: 0413-2255225, Cell: +91-94434 59929 | +91-4433 83039',
  email: 'ifgpondy@gmail.com',
  dealerLine: 'Dealers of: Cuddapah, Marbles, Granites, Natural Stones in Slabs & Tiles'
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
    notes?: string,
    billType: 'cash' | 'credit' = 'cash'
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
      billType,
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

  exportInvoiceAsHtml(invoice: Invoice): string {
    const date = new Date(invoice.invoiceDate).toLocaleDateString('en-IN');
    const itemRows = invoice.items
      .map(
        item => `
        <tr>
          <td>${item.stoneName}</td>
          <td>${item.stoneType}</td>
          <td>${item.size}</td>
          <td>${item.quantity}</td>
          <td>${item.squareFeet.toFixed(2)}</td>
          <td>${item.pricePerUnit.toFixed(2)}</td>
          <td>${item.totalAmount.toFixed(2)}</td>
          <td>${item.gstAmount.toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    const discountAmount = ((invoice.subtotal * (invoice.discount ?? 0)) / 100).toFixed(2);
    const billTitle = invoice.billType === 'credit' ? 'CREDIT BILL' : 'CASH BILL';

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
            .bill-wrap { border: 1px solid #333; padding: 14px; }
            .bill-header { border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 12px; }
            .top-row { display: flex; justify-content: space-between; align-items: start; }
            .brand { text-align: center; flex: 1; }
            .brand h1 { margin: 4px 0; font-size: 34px; letter-spacing: 1px; }
            .brand h2 { margin: 0 0 4px; font-size: 22px; text-decoration: underline; }
            .meta { font-weight: 700; }
            .dealer-line { font-style: italic; margin-top: 4px; }
            .invoice-meta { margin: 8px 0 14px; display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #111; padding: 6px; font-size: 12px; }
            th { background: #f2f2f2; }
            .totals { margin-top: 12px; margin-left: auto; max-width: 360px; }
            .totals-row { display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding: 5px 0; }
            .totals-row.total { font-size: 18px; font-weight: 700; border-bottom: 2px solid #111; }
          </style>
        </head>
        <body>
          <div class="bill-wrap">
            <header class="bill-header">
              <div class="top-row">
                <div class="meta">GSTIN : ${COMPANY_PROFILE.gstin}</div>
                <div class="brand">
                  <h2>${billTitle}</h2>
                  <h1>${COMPANY_PROFILE.name}</h1>
                  <div>${COMPANY_PROFILE.address}</div>
                  <div>${COMPANY_PROFILE.contact} | E-mail: ${COMPANY_PROFILE.email}</div>
                  <div class="dealer-line">(${COMPANY_PROFILE.dealerLine})</div>
                </div>
                <div class="meta">Since : ${COMPANY_PROFILE.since}</div>
              </div>
            </header>

            <section class="invoice-meta">
              <div><strong>Invoice #:</strong> ${invoice.invoiceNumber}</div>
              <div><strong>Date:</strong> ${date}</div>
              <div><strong>Customer:</strong> ${invoice.customerName}</div>
              <div><strong>Payment Type:</strong> ${invoice.billType.toUpperCase()}</div>
            </section>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Qty</th>
                  <th>Sq-Ft</th>
                  <th>Rate</th>
                  <th>Amount</th>
                  <th>GST</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <div class="totals">
              <div class="totals-row"><span>Subtotal</span><strong>INR ${invoice.subtotal.toFixed(2)}</strong></div>
              <div class="totals-row"><span>Discount</span><strong>INR ${discountAmount}</strong></div>
              <div class="totals-row"><span>GST</span><strong>INR ${invoice.gstAmount.toFixed(2)}</strong></div>
              <div class="totals-row total"><span>Grand Total</span><strong>INR ${invoice.total.toFixed(2)}</strong></div>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
