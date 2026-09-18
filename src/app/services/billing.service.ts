import { Injectable, signal } from '@angular/core';
import { Invoice, InvoiceItem } from '../models/invoice.model';
import { InventoryService } from './inventory.service';

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

  constructor(private inventoryService: InventoryService) {}

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

    const stockResult = this.inventoryService.consumeStockBatch(
      items.map(item => ({
        stoneId: item.stoneId,
        size: item.size,
        quantity: item.quantity
      }))
    );

    if (!stockResult.success) {
      throw new Error(`Invoice was not created: ${stockResult.message}`);
    }

    const invoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber: this.generateInvoiceNumber(),
      billType,
      customerName,
      items: items.map(item => ({ ...item })),
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

  deleteInvoice(invoiceId: string): boolean {
    const current = this.invoices();
    const invoice = current.find(inv => inv.id === invoiceId);

    if (!invoice) {
      return false;
    }

    const stockResult = this.inventoryService.addStockBatch(
      invoice.items.map(item => ({
        stoneId: item.stoneId,
        size: item.size,
        quantity: item.quantity
      }))
    );

    if (!stockResult.success) {
      console.error('Unable to restore stock for deleted invoice', stockResult.message);
      return false;
    }

    this.invoices.set(current.filter(inv => inv.id !== invoiceId));
    return true;
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
    const date = new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const billTitle = invoice.billType === 'credit' ? 'CREDIT BILL' : 'CASH BILL';
    const discountAmount = (invoice.subtotal * (invoice.discount ?? 0)) / 100;
    const taxableAmount = invoice.subtotal - discountAmount;
    const letterheadUrl = this.getPublicAssetUrl('brand/ifg-letterhead.jpeg');
    const money = (value: number) =>
      value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const itemRows = invoice.items
      .map(
        (item, index) => `
          <tr>
            <td class="center">${index + 1}</td>
            <td>
              <strong>${this.escapeHtml(item.stoneName)}</strong>
              <small>${this.escapeHtml(item.stoneType)}</small>
            </td>
            <td class="center">${this.escapeHtml(item.size)}</td>
            <td class="number">${item.quantity}</td>
            <td class="number">${item.squareFeet.toFixed(2)}</td>
            <td class="number">${money(item.pricePerUnit)}</td>
            <td class="number">${money(item.totalAmount)}</td>
            <td class="number">${item.gstPercentage}%<small>₹${money(item.gstAmount)}</small></td>
            <td class="number strong">₹${money(item.totalAmount + item.gstAmount)}</td>
          </tr>
        `
      )
      .join('');

    const notes = invoice.notes
      ? `<div class="notes"><strong>Notes</strong><span>${this.escapeHtml(invoice.notes)}</span></div>`
      : '';

    return `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${this.escapeHtml(invoice.invoiceNumber)} · ${billTitle}</title>
          <style>
            @page { size: A4 portrait; margin: 8mm; }
            * { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; color: #050505; background: #fff; }
            body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .sheet { width: 100%; min-height: 277mm; border: 1px solid #111; }
            .letterhead { height: 54mm; overflow: hidden; border-bottom: 2px solid #111; background: #fff; }
            .letterhead img { width: 100%; height: auto; display: block; }
            .bill-band { min-height: 9mm; padding: 0 4mm; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #111; background: #f3f3f3; }
            .bill-band span { font-size: 9px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
            .bill-band strong { padding: 1.5mm 3mm; color: #fff; background: #111; font-size: 10px; letter-spacing: .12em; }
            .party-grid { display: grid; grid-template-columns: 1.35fr .65fr; border-bottom: 1px solid #111; }
            .party, .invoice-info { min-height: 34mm; padding: 4mm; }
            .invoice-info { border-left: 1px solid #111; }
            .section-label { display: block; margin-bottom: 2.5mm; color: #444; font-size: 8px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
            .customer-name { margin-bottom: 2.5mm; font-size: 15px; line-height: 1.15; text-transform: uppercase; }
            .detail-row { min-height: 5mm; display: grid; grid-template-columns: 28mm 1fr; align-items: baseline; gap: 2mm; }
            .detail-row span { color: #555; font-size: 8px; font-weight: 700; text-transform: uppercase; }
            .detail-row strong { font-size: 9.5px; }
            .items { width: 100%; border-collapse: collapse; table-layout: fixed; }
            .items col:nth-child(1) { width: 5%; }
            .items col:nth-child(2) { width: 21%; }
            .items col:nth-child(3) { width: 12%; }
            .items col:nth-child(4) { width: 7%; }
            .items col:nth-child(5) { width: 9%; }
            .items col:nth-child(6) { width: 11%; }
            .items col:nth-child(7) { width: 12%; }
            .items col:nth-child(8) { width: 10%; }
            .items col:nth-child(9) { width: 13%; }
            th, td { border-right: 1px solid #111; border-bottom: 1px solid #111; padding: 2.4mm 1.6mm; vertical-align: top; }
            th:last-child, td:last-child { border-right: 0; }
            th { color: #fff; background: #111; font-size: 7.5px; letter-spacing: .04em; text-align: center; text-transform: uppercase; }
            td { height: 11mm; font-size: 8.5px; }
            td small { margin-top: 1mm; display: block; color: #555; font-size: 7px; }
            .center { text-align: center; }
            .number { text-align: right; font-variant-numeric: tabular-nums; }
            .strong { font-weight: 700; }
            .summary-grid { display: grid; grid-template-columns: 1fr 72mm; border-bottom: 1px solid #111; }
            .terms { padding: 4mm; border-right: 1px solid #111; }
            .terms strong { display: block; margin-bottom: 2mm; font-size: 9px; text-transform: uppercase; }
            .terms p { margin: 1.2mm 0; color: #444; font-size: 7.5px; line-height: 1.45; }
            .totals { padding: 2mm 4mm; }
            .total-row { min-height: 6mm; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px dotted #aaa; }
            .total-row span { color: #444; font-size: 8px; text-transform: uppercase; }
            .total-row strong { font-size: 9.5px; font-variant-numeric: tabular-nums; }
            .grand-total { min-height: 10mm; margin: 1.5mm -4mm -2mm; padding: 0 4mm; border-bottom: 0; color: #fff; background: #111; }
            .grand-total span, .grand-total strong { color: #fff; }
            .grand-total strong { font-size: 15px; }
            .notes { min-height: 10mm; padding: 3mm 4mm; display: grid; grid-template-columns: 24mm 1fr; border-bottom: 1px solid #111; }
            .notes strong { font-size: 8px; text-transform: uppercase; }
            .notes span { font-size: 8.5px; }
            .footer { min-height: 29mm; padding: 4mm; display: grid; grid-template-columns: 1fr 58mm; gap: 8mm; }
            .footer-copy { color: #555; font-size: 7.5px; line-height: 1.5; }
            .footer-copy strong { display: block; color: #111; font-size: 10px; }
            .signature { display: flex; flex-direction: column; justify-content: space-between; text-align: center; font-size: 8px; font-weight: 700; }
            .signature-line { border-top: 1px solid #111; padding-top: 2mm; text-transform: uppercase; }
            thead { display: table-header-group; }
            tr { break-inside: avoid; page-break-inside: avoid; }
            @media screen {
              body { padding: 24px; background: #d8d8d8; }
              .sheet { max-width: 194mm; margin: 0 auto; background: #fff; box-shadow: 0 18px 55px rgba(0, 0, 0, .18); }
            }
          </style>
        </head>
        <body>
          <main class="sheet">
            <header class="letterhead">
              <img src="${this.escapeHtml(letterheadUrl)}" alt="Indo French Granites billhead" />
            </header>

            <div class="bill-band">
              <span>Original for recipient</span>
              <strong>${billTitle}</strong>
            </div>

            <section class="party-grid">
              <div class="party">
                <span class="section-label">Bill to</span>
                <div class="customer-name"><strong>${this.escapeHtml(invoice.customerName)}</strong></div>
                <div class="detail-row"><span>Phone</span><strong>${this.escapeHtml(invoice.customerPhone || '—')}</strong></div>
                <div class="detail-row"><span>E-mail</span><strong>${this.escapeHtml(invoice.customerEmail || '—')}</strong></div>
                <div class="detail-row"><span>Customer GSTIN</span><strong>${this.escapeHtml(invoice.customerGST || '—')}</strong></div>
              </div>
              <div class="invoice-info">
                <span class="section-label">Invoice details</span>
                <div class="detail-row"><span>Bill no.</span><strong>${this.escapeHtml(invoice.invoiceNumber)}</strong></div>
                <div class="detail-row"><span>Date</span><strong>${date}</strong></div>
                <div class="detail-row"><span>Bill type</span><strong>${billTitle}</strong></div>
                <div class="detail-row"><span>Status</span><strong>${invoice.paymentStatus.toUpperCase()}</strong></div>
              </div>
            </section>

            <table class="items">
              <colgroup><col/><col/><col/><col/><col/><col/><col/><col/><col/></colgroup>
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Description</th>
                  <th>Size</th>
                  <th>Qty</th>
                  <th>Sq. ft.</th>
                  <th>Rate / sq. ft.</th>
                  <th>Taxable</th>
                  <th>GST</th>
                  <th>Line total</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <section class="summary-grid">
              <div class="terms">
                <strong>Terms & declaration</strong>
                <p>Goods once sold will not be taken back or exchanged. Natural stone may vary in shade, grain, and texture.</p>
                <p>Subject to Puducherry jurisdiction. Please verify dimensions and quantities before accepting delivery.</p>
              </div>
              <div class="totals">
                <div class="total-row"><span>Subtotal</span><strong>₹${money(invoice.subtotal)}</strong></div>
                <div class="total-row"><span>Discount (${invoice.discount ?? 0}%)</span><strong>− ₹${money(discountAmount)}</strong></div>
                <div class="total-row"><span>Taxable value</span><strong>₹${money(taxableAmount)}</strong></div>
                <div class="total-row"><span>GST</span><strong>₹${money(invoice.gstAmount)}</strong></div>
                <div class="total-row grand-total"><span>Grand total</span><strong>₹${money(invoice.total)}</strong></div>
              </div>
            </section>

            ${notes}

            <footer class="footer">
              <div class="footer-copy">
                <strong>Thank you for choosing Indo French Granites.</strong>
                This is a computer-generated invoice. GSTIN: ${COMPANY_PROFILE.gstin}<br />
                ${COMPANY_PROFILE.address}
              </div>
              <div class="signature">
                <span>For ${COMPANY_PROFILE.name}</span>
                <span class="signature-line">Authorised signatory</span>
              </div>
            </footer>
          </main>
        </body>
      </html>
    `;
  }

  private getPublicAssetUrl(assetPath: string): string {
    if (typeof document === 'undefined') {
      return assetPath;
    }

    return new URL(assetPath, document.baseURI).href;
  }

  private escapeHtml(value: string | number): string {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return String(value).replace(/[&<>"']/g, character => entities[character]);
  }
}
