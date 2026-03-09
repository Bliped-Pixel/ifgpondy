import { Injectable, signal } from '@angular/core';
import { InventoryService } from './inventory.service';
import {
  PurchaseEntry,
  SalesEntry,
  TransactionItem,
  TransactionResult
} from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private salesEntries = signal<SalesEntry[]>([]);
  private purchaseEntries = signal<PurchaseEntry[]>([]);
  private salesCounter = signal(1000);
  private purchaseCounter = signal(2000);

  salesEntries$ = this.salesEntries.asReadonly();
  purchaseEntries$ = this.purchaseEntries.asReadonly();

  constructor(private inventoryService: InventoryService) {}

  createSalesEntry(
    customerName: string,
    items: TransactionItem[],
    discountPercentage: number = 0,
    notes?: string
  ): TransactionResult<SalesEntry> {
    if (!customerName.trim()) {
      return { success: false, message: 'Customer name is required.' };
    }

    if (items.length === 0) {
      return { success: false, message: 'Add at least one sales item.' };
    }

    for (const item of items) {
      const stockResult = this.inventoryService.consumeStockWithCutting(
        item.stoneId,
        item.size,
        item.quantity
      );

      if (!stockResult.success) {
        return {
          success: false,
          message: `Stock update failed for ${item.stoneName} (${item.size}): ${stockResult.message}`
        };
      }
    }

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const gstTotal = items.reduce((sum, item) => sum + item.gstAmount, 0);
    const discountAmount = (subtotal * discountPercentage) / 100;
    const grandTotal = subtotal - discountAmount + gstTotal;

    const entry: SalesEntry = {
      id: Date.now().toString(),
      billNumber: this.generateSalesNumber(),
      customerName,
      salesDate: new Date(),
      items,
      subtotal,
      gstTotal,
      discountPercentage,
      discountAmount,
      grandTotal,
      notes
    };

    this.salesEntries.set([entry, ...this.salesEntries()]);
    return { success: true, data: entry, message: 'Sales entry saved.' };
  }

  createPurchaseEntry(
    supplierName: string,
    items: TransactionItem[],
    notes?: string
  ): TransactionResult<PurchaseEntry> {
    if (!supplierName.trim()) {
      return { success: false, message: 'Supplier name is required.' };
    }

    if (items.length === 0) {
      return { success: false, message: 'Add at least one purchase item.' };
    }

    for (const item of items) {
      const stockResult = this.inventoryService.addSizeStock(item.stoneId, item.size, item.quantity);
      if (!stockResult.success) {
        return {
          success: false,
          message: `Stock update failed for ${item.stoneName} (${item.size}): ${stockResult.message}`
        };
      }
    }

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const gstTotal = items.reduce((sum, item) => sum + item.gstAmount, 0);
    const grandTotal = subtotal + gstTotal;

    const entry: PurchaseEntry = {
      id: Date.now().toString(),
      purchaseNumber: this.generatePurchaseNumber(),
      supplierName,
      purchaseDate: new Date(),
      items,
      subtotal,
      gstTotal,
      grandTotal,
      notes
    };

    this.purchaseEntries.set([entry, ...this.purchaseEntries()]);
    return { success: true, data: entry, message: 'Purchase entry saved.' };
  }

  private generateSalesNumber(): string {
    const current = this.salesCounter();
    this.salesCounter.set(current + 1);
    return `SE-${new Date().getFullYear()}-${current}`;
  }

  private generatePurchaseNumber(): string {
    const current = this.purchaseCounter();
    this.purchaseCounter.set(current + 1);
    return `PE-${new Date().getFullYear()}-${current}`;
  }
}
