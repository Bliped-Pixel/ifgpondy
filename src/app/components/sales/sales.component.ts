import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../../services/billing.service';
import { InventoryService } from '../../services/inventory.service';
import { TransactionService } from '../../services/transaction.service';
import { Stone, StoneSize } from '../../models/stone.model';
import { TransactionItem } from '../../models/transaction.model';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css']
})
export class SalesComponent {
  availableStones: Stone[] = [];
  salesEntries$;

  customerName = '';
  discountPercentage = 0;
  notes = '';

  selectedStone = '';
  selectedSizeId = '';
  selectedQuantity = 1;

  items: TransactionItem[] = [];

  constructor(
    private transactionService: TransactionService,
    private inventoryService: InventoryService,
    private billingService: BillingService
  ) {
    this.salesEntries$ = this.transactionService.salesEntries$;
    this.availableStones = this.inventoryService.getAvailableStones();
  }

  getSizesForSelectedStone(): StoneSize[] {
    const stone = this.inventoryService.getStone(this.selectedStone);
    return stone ? stone.sizes : [];
  }

  addItem(): void {
    const stone = this.inventoryService.getStone(this.selectedStone);
    const size = this.getSizesForSelectedStone().find(item => item.id === this.selectedSizeId);

    if (!stone || !size || this.selectedQuantity <= 0) {
      alert('Select stone, size and valid quantity.');
      return;
    }

    const availability = this.inventoryService.getCuttingAvailability(
      stone.id,
      size.dimension,
      this.selectedQuantity
    );

    if (!availability.canDeliver) {
      alert(`Cannot deliver requested quantity. Shortage: ${availability.shortage}.`);
      return;
    }

    const squareFeet = this.calculateSquareFeet(size.dimension, this.selectedQuantity);
    const amount = squareFeet * stone.pricePerUnit;
    const gstPercentage = this.billingService.getGSTPercentageForStoneType(stone.type);
    const gstAmount = (amount * gstPercentage) / 100;

    this.items.push({
      id: Date.now().toString(),
      stoneId: stone.id,
      stoneName: stone.name,
      stoneType: stone.type,
      size: size.dimension,
      quantity: this.selectedQuantity,
      squareFeet,
      ratePerSqFt: stone.pricePerUnit,
      amount,
      gstPercentage,
      gstAmount,
      lineTotal: amount + gstAmount
    });

    this.selectedStone = '';
    this.selectedSizeId = '';
    this.selectedQuantity = 1;
  }

  removeItem(itemId: string): void {
    this.items = this.items.filter(item => item.id !== itemId);
  }

  saveSalesEntry(): void {
    const result = this.transactionService.createSalesEntry(
      this.customerName,
      this.items,
      this.discountPercentage,
      this.notes
    );

    if (!result.success) {
      alert(result.message);
      return;
    }

    alert(`Sales entry created: ${result.data?.billNumber}`);
    this.customerName = '';
    this.discountPercentage = 0;
    this.notes = '';
    this.items = [];
    this.availableStones = this.inventoryService.getAvailableStones();
  }

  calculateSubtotal(): number {
    return this.items.reduce((sum, item) => sum + item.amount, 0);
  }

  calculateGSTTotal(): number {
    return this.items.reduce((sum, item) => sum + item.gstAmount, 0);
  }

  calculateGrandTotal(): number {
    const subtotal = this.calculateSubtotal();
    const discountAmount = (subtotal * this.discountPercentage) / 100;
    return subtotal - discountAmount + this.calculateGSTTotal();
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
