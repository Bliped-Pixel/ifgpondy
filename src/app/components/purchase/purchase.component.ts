import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PurchaseEntry, TransactionItem } from '../../models/transaction.model';
import { Stone, StoneSize } from '../../models/stone.model';
import { BillingService } from '../../services/billing.service';
import { InventoryService } from '../../services/inventory.service';
import { TransactionService } from '../../services/transaction.service';

type PostingMode = 'auto' | 'purchase' | 'stock-only';

@Component({
  selector: 'app-purchase',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.css']
})
export class PurchaseComponent {
  readonly majorRefillThreshold = 10;
  readonly stones$;
  readonly purchaseEntries$;

  supplierName = '';
  purchaseDate = new Date().toISOString().slice(0, 10);
  notes = '';
  postingMode: PostingMode = 'auto';

  selectedStone = '';
  selectedSizeId = '';
  selectedQuantity = 1;
  selectedUnitCost = 0;

  items: TransactionItem[] = [];
  formError = '';
  successMessage = '';
  historySearch = '';

  constructor(
    private transactionService: TransactionService,
    private inventoryService: InventoryService,
    private billingService: BillingService
  ) {
    this.purchaseEntries$ = this.transactionService.purchaseEntries$;
    this.stones$ = this.inventoryService.stones$;
  }

  get activeStone(): Stone | null {
    return this.selectedStone ? this.inventoryService.getStone(this.selectedStone) ?? null : null;
  }

  getSizesForSelectedStone(): StoneSize[] {
    return this.activeStone?.sizes ?? [];
  }

  onStoneSelectionChange(): void {
    this.selectedSizeId = '';
    if (!this.supplierName && this.activeStone?.supplier) {
      this.supplierName = this.activeStone.supplier;
    }
  }

  addItem(): void {
    const stone = this.activeStone;
    const size = this.getSizesForSelectedStone().find(item => item.id === this.selectedSizeId);
    const quantity = Math.floor(Number(this.selectedQuantity));
    const unitCost = Math.max(0, Number(this.selectedUnitCost) || 0);

    if (!stone || !size || !Number.isFinite(quantity) || quantity <= 0) {
      this.formError = 'Choose a material, size, and refill quantity above zero.';
      return;
    }

    const squareFeet = this.calculateSquareFeet(size.dimension, quantity);
    const amount = squareFeet * unitCost;
    const gstPercentage = this.billingService.getGSTPercentageForStoneType(stone.type);
    const gstAmount = (amount * gstPercentage) / 100;

    this.items.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      stoneId: stone.id,
      stoneName: stone.name,
      stoneType: stone.type,
      size: size.dimension,
      quantity,
      squareFeet,
      ratePerSqFt: unitCost,
      amount,
      gstPercentage,
      gstAmount,
      lineTotal: amount + gstAmount
    });

    this.formError = '';
    this.successMessage = '';
    this.selectedStone = '';
    this.selectedSizeId = '';
    this.selectedQuantity = 1;
    this.selectedUnitCost = 0;
  }

  updateItemCost(item: TransactionItem, value: number): void {
    const cost = Math.max(0, Number(value) || 0);
    item.ratePerSqFt = cost;
    item.amount = item.squareFeet * cost;
    item.gstAmount = (item.amount * item.gstPercentage) / 100;
    item.lineTotal = item.amount + item.gstAmount;
  }

  removeItem(itemId: string): void {
    this.items = this.items.filter(item => item.id !== itemId);
  }

  get totalRefillQuantity(): number {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  get requiresPurchaseRecord(): boolean {
    return this.totalRefillQuantity >= this.majorRefillThreshold;
  }

  get willCreatePurchaseRecord(): boolean {
    return this.requiresPurchaseRecord || this.postingMode === 'purchase';
  }

  get trackingMessage(): string {
    if (this.requiresPurchaseRecord) {
      return `This is a major refill (${this.totalRefillQuantity} pieces), so a purchase record is required.`;
    }
    if (this.postingMode === 'purchase') {
      return 'This refill will update stock and create a purchase record.';
    }
    return 'This minor refill will update stock only and stay out of the purchase register.';
  }

  saveRefill(): void {
    if (this.items.length === 0) {
      this.formError = 'Add at least one refill item.';
      return;
    }

    if (this.willCreatePurchaseRecord && !this.supplierName.trim()) {
      this.formError = 'Supplier name is required when creating a purchase record.';
      return;
    }

    if (this.willCreatePurchaseRecord && this.items.some(item => item.ratePerSqFt <= 0)) {
      this.formError = 'Enter the purchase cost for every item before posting this purchase.';
      return;
    }

    const result = this.willCreatePurchaseRecord
      ? this.transactionService.createPurchaseEntry(
          this.supplierName,
          this.items,
          this.notes,
          this.toPurchaseDate(this.purchaseDate)
        )
      : this.transactionService.applyStockRefill(this.items);

    if (!result.success) {
      this.formError = result.message;
      return;
    }

    this.successMessage = result.data
      ? `${result.data.purchaseNumber} was posted and inventory was updated.`
      : 'Minor refill applied to inventory without creating a purchase record.';
    this.resetDraft(false);
  }

  resetDraft(clearMessage = true): void {
    this.supplierName = '';
    this.purchaseDate = new Date().toISOString().slice(0, 10);
    this.notes = '';
    this.postingMode = 'auto';
    this.selectedStone = '';
    this.selectedSizeId = '';
    this.selectedQuantity = 1;
    this.selectedUnitCost = 0;
    this.items = [];
    this.formError = '';
    if (clearMessage) this.successMessage = '';
  }

  calculateSubtotal(): number {
    return this.items.reduce((sum, item) => sum + item.amount, 0);
  }

  calculateGSTTotal(): number {
    return this.items.reduce((sum, item) => sum + item.gstAmount, 0);
  }

  calculateGrandTotal(): number {
    return this.calculateSubtotal() + this.calculateGSTTotal();
  }

  get totalPurchaseSpend(): number {
    return this.purchaseEntries$().reduce((total, entry) => total + entry.grandTotal, 0);
  }

  get recordedPieces(): number {
    return this.purchaseEntries$().reduce(
      (total, entry) => total + entry.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0),
      0
    );
  }

  get supplierCount(): number {
    return new Set(this.purchaseEntries$().map(entry => entry.supplierName.toLowerCase())).size;
  }

  get filteredPurchases(): PurchaseEntry[] {
    const query = this.historySearch.trim().toLowerCase();
    if (!query) return this.purchaseEntries$();

    return this.purchaseEntries$().filter(
      entry =>
        entry.purchaseNumber.toLowerCase().includes(query) ||
        entry.supplierName.toLowerCase().includes(query) ||
        entry.items.some(item => item.stoneName.toLowerCase().includes(query))
    );
  }

  getEntryPieces(entry: PurchaseEntry): number {
    return entry.items.reduce((total, item) => total + item.quantity, 0);
  }

  trackPurchase(_index: number, entry: PurchaseEntry): string {
    return entry.id;
  }

  private toPurchaseDate(value: string): Date {
    return value ? new Date(`${value}T12:00:00`) : new Date();
  }

  private calculateSquareFeet(size: string, quantity: number): number {
    const dimensions = size
      .toLowerCase()
      .split('x')
      .map(value => Number(value.trim()));

    if (dimensions.length !== 2 || dimensions.some(value => Number.isNaN(value) || value <= 0)) {
      return quantity;
    }

    const [length, width] = dimensions;
    const isInches = length > 10 || width > 10;
    const lengthInFeet = isInches ? length / 12 : length;
    const widthInFeet = isInches ? width / 12 : width;

    return lengthInFeet * widthInFeet * quantity;
  }
}
