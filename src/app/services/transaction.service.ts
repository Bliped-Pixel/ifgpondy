import { computed, Injectable, signal } from '@angular/core';
import { BillingService } from './billing.service';
import { InventoryService } from './inventory.service';
import {
  PurchaseEntry,
  SalesEntry,
  TransactionItem,
  TransactionResult,
  VoucherEntry,
  VoucherType
} from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private purchaseEntries = signal<PurchaseEntry[]>([]);
  private voucherEntries = signal<VoucherEntry[]>([]);
  private purchaseCounter = signal(2000);
  private voucherCounter = signal(3000);

  readonly salesEntries$ = computed<SalesEntry[]>(() =>
    [...this.billingService.invoices$()]
      .map(invoice => ({
        id: `sale-${invoice.id}`,
        sourceInvoiceId: invoice.id,
        billNumber: invoice.invoiceNumber,
        billType: invoice.billType,
        paymentStatus: invoice.paymentStatus,
        customerName: invoice.customerName,
        salesDate: new Date(invoice.invoiceDate),
        items: invoice.items.map(item => ({
          id: item.id,
          stoneId: item.stoneId,
          stoneName: item.stoneName,
          stoneType: item.stoneType,
          size: item.size,
          quantity: item.quantity,
          squareFeet: item.squareFeet,
          ratePerSqFt: item.pricePerUnit,
          amount: item.totalAmount,
          gstPercentage: item.gstPercentage,
          gstAmount: item.gstAmount,
          lineTotal: item.totalAmount + item.gstAmount
        })),
        subtotal: invoice.subtotal,
        gstTotal: invoice.gstAmount,
        discountPercentage: invoice.discount || 0,
        discountAmount: (invoice.subtotal * (invoice.discount || 0)) / 100,
        grandTotal: invoice.total,
        notes: invoice.notes
      }))
      .sort((a, b) => b.salesDate.getTime() - a.salesDate.getTime())
  );

  readonly purchaseEntries$ = this.purchaseEntries.asReadonly();
  readonly voucherEntries$ = this.voucherEntries.asReadonly();

  constructor(
    private inventoryService: InventoryService,
    private billingService: BillingService
  ) {}

  createPurchaseEntry(
    supplierName: string,
    items: TransactionItem[],
    notes?: string,
    purchaseDate: Date = new Date()
  ): TransactionResult<PurchaseEntry> {
    if (!supplierName.trim()) {
      return { success: false, message: 'Supplier name is required for a purchase record.' };
    }

    if (items.length === 0) {
      return { success: false, message: 'Add at least one purchase item.' };
    }

    const stockResult = this.inventoryService.addStockBatch(
      items.map(item => ({ stoneId: item.stoneId, size: item.size, quantity: item.quantity }))
    );
    if (!stockResult.success) {
      return { success: false, message: `Stock update failed: ${stockResult.message}` };
    }

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const gstTotal = items.reduce((sum, item) => sum + item.gstAmount, 0);
    const grandTotal = subtotal + gstTotal;

    const entry: PurchaseEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      purchaseNumber: this.generatePurchaseNumber(),
      supplierName: supplierName.trim(),
      purchaseDate,
      items: items.map(item => ({ ...item })),
      subtotal,
      gstTotal,
      grandTotal,
      notes: notes?.trim() || undefined
    };

    this.purchaseEntries.set([entry, ...this.purchaseEntries()]);
    return { success: true, data: entry, message: 'Purchase recorded and stock updated.' };
  }

  applyStockRefill(items: TransactionItem[]): TransactionResult<undefined> {
    if (items.length === 0) {
      return { success: false, message: 'Add at least one refill item.' };
    }

    const stockResult = this.inventoryService.addStockBatch(
      items.map(item => ({ stoneId: item.stoneId, size: item.size, quantity: item.quantity }))
    );

    return {
      success: stockResult.success,
      message: stockResult.success ? 'Minor stock refill applied without a purchase posting.' : stockResult.message
    };
  }

  private generatePurchaseNumber(): string {
    const current = this.purchaseCounter();
    this.purchaseCounter.set(current + 1);
    return `PE-${new Date().getFullYear()}-${current}`;
  }

  createVoucherEntry(
    voucherType: VoucherType,
    partyName: string,
    ledgerName: string,
    amount: number,
    paymentMode: 'cash' | 'bank' | 'upi' | 'cheque',
    note?: string,
    voucherDate: Date = new Date()
  ): TransactionResult<VoucherEntry> {
    if (!partyName.trim()) {
      return { success: false, message: 'Party name is required.' };
    }

    if (!ledgerName.trim()) {
      return { success: false, message: 'Ledger name is required.' };
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, message: 'Amount must be greater than zero.' };
    }

    const entry: VoucherEntry = {
      id: Date.now().toString(),
      voucherNumber: this.generateVoucherNumber(voucherType),
      voucherType,
      partyName,
      ledgerName,
      amount,
      paymentMode,
      voucherDate,
      note
    };

    this.voucherEntries.set([entry, ...this.voucherEntries()]);
    return { success: true, data: entry, message: 'Voucher entry saved.' };
  }

  getVoucherEntriesByType(voucherType: VoucherType): VoucherEntry[] {
    return this.voucherEntries().filter(entry => entry.voucherType === voucherType);
  }

  private generateVoucherNumber(voucherType: VoucherType): string {
    const current = this.voucherCounter();
    this.voucherCounter.set(current + 1);

    const prefix = voucherType === 'receipt' ? 'RV' : voucherType === 'payment' ? 'PV' : 'CV';
    return `${prefix}-${new Date().getFullYear()}-${current}`;
  }
}
