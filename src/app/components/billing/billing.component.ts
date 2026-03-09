import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../../services/billing.service';
import { CuttingAvailabilityResult, InventoryService } from '../../services/inventory.service';
import { InvoiceItem, Invoice } from '../../models/invoice.model';
import { Stone, StoneSize } from '../../models/stone.model';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.css']
})
export class BillingComponent {
  invoices$: any;
  availableStones: Stone[] = [];

  // Form data
  customerName = '';
  customerEmail = '';
  customerPhone = '';
  customerGST = '';
  discount = 0;
  notes = '';

  // Invoice items
  invoiceItems: InvoiceItem[] = [];
  selectedStone: string = '';
  selectedSizeId: string = '';
  selectedQuantity = 1;
  itemAvailability: CuttingAvailabilityResult | null = null;

  showInvoiceForm = false;
  showInvoiceDetails = false;
  selectedInvoice: Invoice | null = null;

  constructor(
    private billingService: BillingService,
    private inventoryService: InventoryService
  ) {
    this.invoices$ = this.billingService.invoices$;
    this.updateAvailableStones();
  }

  updateAvailableStones(): void {
    this.availableStones = this.inventoryService.getAvailableStones();
  }

  addItemToInvoice(): void {
    if (!this.selectedStone || !this.selectedSizeId || this.selectedQuantity <= 0) {
      alert('Please select a stone, size and enter quantity');
      return;
    }

    const stone = this.inventoryService.getStone(this.selectedStone);
    if (!stone) return;

    const selectedSize = stone.sizes.find(size => size.id === this.selectedSizeId);
    if (!selectedSize) {
      alert('Selected size is invalid for this stone');
      return;
    }

    this.updateItemAvailability();
    if (!this.itemAvailability?.canDeliver) {
      const shortageText = this.itemAvailability ? ` Short by ${this.itemAvailability.shortage} piece(s).` : '';
      alert(`Cannot add this item now.${shortageText}`);
      return;
    }

    const squareFeet = this.calculateSquareFeet(selectedSize.dimension, this.selectedQuantity);
    const totalAmount = stone.pricePerUnit * squareFeet;
    const gstPercentage = this.billingService.getGSTPercentageForStoneType(stone.type);
    const gstAmount = (totalAmount * gstPercentage) / 100;

    const item: InvoiceItem = {
      id: Date.now().toString(),
      stoneId: stone.id,
      stoneName: stone.name,
      stoneType: stone.type,
      size: selectedSize.dimension,
      quantity: this.selectedQuantity,
      unit: 'pieces',
      squareFeet,
      pricePerUnit: stone.pricePerUnit,
      gstPercentage,
      gstAmount,
      totalAmount
    };

    this.invoiceItems.push(item);
    this.selectedStone = '';
    this.selectedSizeId = '';
    this.selectedQuantity = 1;
    this.itemAvailability = null;
  }

  removeItem(itemId: string): void {
    this.invoiceItems = this.invoiceItems.filter(item => item.id !== itemId);
  }

  createInvoice(): void {
    if (!this.customerName) {
      alert('Please enter customer name');
      return;
    }

    if (this.invoiceItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    const invoice = this.billingService.createInvoice(
      this.customerName,
      this.invoiceItems,
      this.discount,
      this.notes
    );

    // Keep customer info
    invoice.customerEmail = this.customerEmail;
    invoice.customerPhone = this.customerPhone;
    invoice.customerGST = this.customerGST;

    this.resetForm();
    alert(`Invoice created successfully! Invoice #: ${invoice.invoiceNumber}`);
  }

  resetForm(): void {
    this.customerName = '';
    this.customerEmail = '';
    this.customerPhone = '';
    this.customerGST = '';
    this.invoiceItems = [];
    this.discount = 0;
    this.notes = '';
    this.showInvoiceForm = false;
    this.selectedStone = '';
    this.selectedSizeId = '';
    this.selectedQuantity = 1;
    this.itemAvailability = null;
  }

  viewInvoice(invoice: Invoice): void {
    this.selectedInvoice = invoice;
    this.showInvoiceDetails = true;
  }

  printInvoice(invoice: Invoice): void {
    const text = this.billingService.exportInvoiceAsText(invoice);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoiceNumber}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  updatePaymentStatus(invoiceId: string): void {
    const invoice = this.billingService.getInvoice(invoiceId);
    if (invoice) {
      const newStatus =
        invoice.paymentStatus === 'pending'
          ? 'paid'
          : invoice.paymentStatus === 'paid'
            ? 'partial'
            : 'pending';
      this.billingService.updateInvoiceStatus(invoiceId, newStatus);
    }
  }

  deleteInvoice(invoiceId: string): void {
    if (confirm('Are you sure you want to delete this invoice?')) {
      this.billingService.deleteInvoice(invoiceId);
    }
  }

  calculateSubtotal(): number {
    return this.invoiceItems.reduce((sum, item) => sum + item.totalAmount, 0);
  }

  calculateGST(): number {
    const rawSubtotal = this.calculateSubtotal();
    const rawGST = this.invoiceItems.reduce((sum, item) => sum + item.gstAmount, 0);
    const discountFactor = rawSubtotal > 0 ? (100 - this.discount) / 100 : 0;
    return rawGST * discountFactor;
  }

  calculateTotal(): number {
    return this.calculateSubtotal() - (this.calculateSubtotal() * this.discount) / 100 + this.calculateGST();
  }

  calculateEffectiveGSTPercentage(): number {
    const subtotal = this.calculateSubtotal();
    if (subtotal === 0) return 0;

    const discountedSubtotal = subtotal - (subtotal * this.discount) / 100;
    if (discountedSubtotal === 0) return 0;

    return (this.calculateGST() / discountedSubtotal) * 100;
  }

  getSizesForSelectedStone(): StoneSize[] {
    const stone = this.inventoryService.getStone(this.selectedStone);
    return stone ? stone.sizes : [];
  }

  onStoneSelectionChange(): void {
    this.selectedSizeId = '';
    this.updateItemAvailability();
  }

  onSizeOrQuantityChange(): void {
    this.updateItemAvailability();
  }

  private updateItemAvailability(): void {
    if (!this.selectedStone || !this.selectedSizeId || this.selectedQuantity <= 0) {
      this.itemAvailability = null;
      return;
    }

    const stone = this.inventoryService.getStone(this.selectedStone);
    if (!stone) {
      this.itemAvailability = null;
      return;
    }

    const selectedSize = stone.sizes.find(size => size.id === this.selectedSizeId);
    if (!selectedSize) {
      this.itemAvailability = null;
      return;
    }

    this.itemAvailability = this.inventoryService.getCuttingAvailability(
      stone.id,
      selectedSize.dimension,
      this.selectedQuantity
    );
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

  getTotalRevenue(): number {
    return this.billingService.calculateTotalRevenue();
  }

  getPendingInvoices(): Invoice[] {
    return this.billingService.getPendingInvoices();
  }

  closeInvoiceDetails(): void {
    this.showInvoiceDetails = false;
    this.selectedInvoice = null;
  }
}
