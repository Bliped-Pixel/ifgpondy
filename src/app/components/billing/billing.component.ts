import { ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import interact from 'interactjs';
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
export class BillingComponent implements OnDestroy {
  invoices$: any;
  availableStones: Stone[] = [];

  // Invoice/customer data
  customerName = '';
  customerEmail = '';
  customerPhone = '';
  customerGST = '';
  billType: 'cash' | 'credit' = 'cash';
  discount = 0;
  notes = '';

  // Invoice item data
  invoiceItems: InvoiceItem[] = [];
  selectedStone = '';
  selectedSizeId = '';
  selectedQuantity = 1;
  itemAvailability: CuttingAvailabilityResult | null = null;

  // Reimagined selection studio
  stoneSearch = '';
  stoneTypeFilter = 'all';
  customWidth = 4;
  customHeight = 4;
  readonly boardMaxDimension = 10;
  readonly quarterStep = 0.25;
  isBoardSizing = false;
  availabilityCheckError = '';

  // Interact.js owns the resize gesture. Angular remains the source of truth
  // for dimensions, availability and pricing.
  private cutBoardElement: HTMLElement | null = null;
  private cutSelectionElement: HTMLElement | null = null;
  private selectionInteractable: any = null;

  @ViewChild('cutSelection')
  set cutSelectionRef(ref: ElementRef<HTMLElement> | undefined) {
    if (!ref) {
      this.destroyCutInteraction();
      this.cutBoardElement = null;
      this.cutSelectionElement = null;
      return;
    }

    this.cutSelectionElement = ref.nativeElement;
    this.cutBoardElement = ref.nativeElement.closest('.cut-board') as HTMLElement | null;

    // Let Angular finish laying out the responsive board before Interact.js
    // measures it. This is especially important because the studio is under *ngIf.
    queueMicrotask(() => {
      this.setupCutBoardInteraction();
      this.syncSelectionBox();
    });
  }

  showInvoiceForm = false;
  showInvoiceDetails = false;
  selectedInvoice: Invoice | null = null;

  constructor(
    private billingService: BillingService,
    private inventoryService: InventoryService,
    private cdr: ChangeDetectorRef
  ) {
    this.invoices$ = this.billingService.invoices$;
    this.updateAvailableStones();
  }

  updateAvailableStones(): void {
    this.availableStones = this.inventoryService.getAvailableStones();
  }

  get activeStone(): Stone | null {
    return this.selectedStone ? this.inventoryService.getStone(this.selectedStone) ?? null : null;
  }

  get activeDimension(): string {
    return `${this.formatDimension(this.customWidth)}x${this.formatDimension(this.customHeight)}`;
  }

  get selectedAreaPerPiece(): number {
    return this.customWidth * this.customHeight;
  }

  get selectedAreaTotal(): number {
    return this.selectedAreaPerPiece * Math.max(1, this.selectedQuantity || 1);
  }

  get estimatedItemAmount(): number {
    const stone = this.activeStone;
    return stone ? stone.pricePerUnit * this.selectedAreaTotal : 0;
  }

  get selectionWidthPercent(): number {
    return (this.customWidth / this.boardMaxDimension) * 100;
  }

  get selectionHeightPercent(): number {
    return (this.customHeight / this.boardMaxDimension) * 100;
  }

  get stoneTypeFilters(): string[] {
    return Array.from(new Set(this.availableStones.map(stone => stone.type).filter(Boolean)));
  }

  filteredStones(): Stone[] {
    const query = this.stoneSearch.trim().toLowerCase();
    return this.availableStones.filter(stone => {
      const matchesType = this.stoneTypeFilter === 'all' || stone.type === this.stoneTypeFilter;
      const matchesSearch =
        !query ||
        stone.name.toLowerCase().includes(query) ||
        stone.type.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }

  selectStone(stone: Stone): void {
    this.selectedStone = stone.id;
    this.selectedSizeId = '';
    this.availabilityCheckError = '';

    // Keep the board at a useful 4x4 default, but use the first real size if 4x4 is impossible.
    const fourByFour = stone.sizes.find(size => this.normaliseDimension(size.dimension) === '4x4');
    if (fourByFour) {
      this.choosePresetSize(fourByFour);
      return;
    }

    if (stone.sizes.length > 0) {
      const parsed = this.parseDimension(stone.sizes[0].dimension);
      if (parsed && parsed.width <= this.boardMaxDimension && parsed.height <= this.boardMaxDimension) {
        this.customWidth = this.snapQuarter(parsed.width);
        this.customHeight = this.snapQuarter(parsed.height);
        this.selectedSizeId = stone.sizes[0].id;
      }
    }

    this.updateItemAvailability();
  }

  choosePresetSize(size: StoneSize): void {
    const parsed = this.parseDimension(size.dimension);
    if (!parsed) return;

    this.customWidth = this.clampDimension(parsed.width);
    this.customHeight = this.clampDimension(parsed.height);
    this.selectedSizeId = size.id;
    this.updateItemAvailability();
  }

  isPresetActive(size: StoneSize): boolean {
    return this.normaliseDimension(size.dimension) === this.normaliseDimension(this.activeDimension);
  }

  getSizesForSelectedStone(): StoneSize[] {
    return this.activeStone?.sizes ?? [];
  }

  getStoneStockCount(stone: Stone): number {
    return stone.sizes.reduce((total, size) => {
      const raw = size as any;
      const quantity = Number(raw.quantity ?? raw.stock ?? raw.availableQuantity ?? raw.count ?? 0);
      return total + (Number.isFinite(quantity) ? quantity : 0);
    }, 0);
  }

  getStoneBackground(stone: Stone): string {
    const name = `${stone.name}-${stone.type}`;
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return `
      radial-gradient(circle at 22% 24%, hsla(${hue}, 20%, 94%, .72) 0 8%, transparent 9%),
      radial-gradient(circle at 72% 64%, hsla(${(hue + 35) % 360}, 18%, 20%, .18) 0 6%, transparent 7%),
      linear-gradient(125deg, hsl(${hue}, 12%, 45%), hsl(${(hue + 18) % 360}, 10%, 76%) 48%, hsl(${hue}, 9%, 36%))
    `;
  }

  private setupCutBoardInteraction(): void {
    const selection = this.cutSelectionElement;
    const board = this.cutBoardElement;
    if (!selection || !board || !this.activeStone) return;

    this.destroyCutInteraction();

    this.selectionInteractable = interact(selection).resizable({
      // The visible orange corner is the only resize grab point. This is much
      // more predictable than listening for raw pointer movement on the board.
      edges: {
        right: '.resize-handle',
        bottom: '.resize-handle',
        left: false,
        top: false
      },
      inertia: false,
      modifiers: [
        interact.modifiers.restrictSize({
          min: {
            width: board.clientWidth / (this.boardMaxDimension / this.quarterStep),
            height: board.clientHeight / (this.boardMaxDimension / this.quarterStep)
          },
          max: { width: board.clientWidth, height: board.clientHeight }
        })
      ],
      listeners: {
        start: () => {
          this.isBoardSizing = true;
          this.cdr.detectChanges();
        },
        move: (event: any) => {
          const boardRect = board.getBoundingClientRect();
          if (!boardRect.width || !boardRect.height) return;

          const widthFeet = (event.rect.width / boardRect.width) * this.boardMaxDimension;
          const heightFeet = (event.rect.height / boardRect.height) * this.boardMaxDimension;

          this.customWidth = this.clampDimension(widthFeet);
          this.customHeight = this.clampDimension(heightFeet);
          this.selectedSizeId = '';

          // Apply the snapped dimensions immediately for a smooth resize even
          // when the app is running Angular's zoneless change detection.
          selection.style.width = `${this.selectionWidthPercent}%`;
          selection.style.height = `${this.selectionHeightPercent}%`;
          this.cdr.detectChanges();
        },
        end: () => {
          this.isBoardSizing = false;
          this.syncPresetSelection();
          this.updateItemAvailability();
          this.syncSelectionBox();
          this.cdr.detectChanges();
        }
      }
    });
  }

  private destroyCutInteraction(): void {
    if (this.selectionInteractable) {
      this.selectionInteractable.unset();
      this.selectionInteractable = null;
    }
  }

  private syncSelectionBox(): void {
    if (!this.cutSelectionElement) return;
    this.cutSelectionElement.style.width = `${this.selectionWidthPercent}%`;
    this.cutSelectionElement.style.height = `${this.selectionHeightPercent}%`;
  }

  ngOnDestroy(): void {
    this.destroyCutInteraction();
  }

  changeDimension(axis: 'width' | 'height', delta: number): void {
    if (axis === 'width') {
      this.customWidth = this.clampDimension(this.customWidth + delta);
    } else {
      this.customHeight = this.clampDimension(this.customHeight + delta);
    }
    this.dimensionChanged();
  }

  onDimensionInput(): void {
    this.customWidth = this.clampDimension(Number(this.customWidth));
    this.customHeight = this.clampDimension(Number(this.customHeight));
    this.dimensionChanged();
  }

  private dimensionChanged(): void {
    this.syncSelectionBox();
    this.syncPresetSelection();
    this.updateItemAvailability();
  }

  rotateSelection(): void {
    const width = this.customWidth;
    this.customWidth = this.customHeight;
    this.customHeight = width;
    this.dimensionChanged();
  }

  setSquareSize(size: number): void {
    this.customWidth = this.clampDimension(size);
    this.customHeight = this.clampDimension(size);
    this.dimensionChanged();
  }

  decreaseQuantity(): void {
    this.selectedQuantity = Math.max(1, (Number(this.selectedQuantity) || 1) - 1);
    this.updateItemAvailability();
  }

  increaseQuantity(): void {
    this.selectedQuantity = Math.max(1, (Number(this.selectedQuantity) || 1) + 1);
    this.updateItemAvailability();
  }

  onQuantityInput(): void {
    this.selectedQuantity = Math.max(1, Math.floor(Number(this.selectedQuantity) || 1));
    this.updateItemAvailability();
  }

  private syncPresetSelection(): void {
    const matchingSize = this.getSizesForSelectedStone().find(
      size => this.normaliseDimension(size.dimension) === this.normaliseDimension(this.activeDimension)
    );
    this.selectedSizeId = matchingSize?.id ?? '';
  }

  private updateItemAvailability(): void {
    if (!this.selectedStone || this.selectedQuantity <= 0 || this.customWidth <= 0 || this.customHeight <= 0) {
      this.itemAvailability = null;
      this.availabilityCheckError = '';
      return;
    }

    const stone = this.activeStone;
    if (!stone) {
      this.itemAvailability = null;
      return;
    }

    try {
      this.itemAvailability = this.inventoryService.getCuttingAvailability(
        stone.id,
        this.activeDimension,
        this.selectedQuantity
      );
      this.availabilityCheckError = '';
    } catch (error) {
      console.error('Availability check failed for custom dimension', error);
      this.itemAvailability = null;
      this.availabilityCheckError = 'This custom size could not be validated by the inventory service.';
    }
  }

  addItemToInvoice(): void {
    if (!this.selectedStone || this.selectedQuantity <= 0) {
      alert('Choose a stone and enter a valid quantity.');
      return;
    }

    const stone = this.activeStone;
    if (!stone) return;

    this.updateItemAvailability();
    if (!this.itemAvailability?.canDeliver) {
      const shortageText = this.itemAvailability ? ` Short by ${this.itemAvailability.shortage} piece(s).` : '';
      alert(`Cannot add this cut from the available inventory.${shortageText}`);
      return;
    }

    const dimension = this.activeDimension;
    const squareFeet = this.calculateSquareFeet(dimension, this.selectedQuantity);
    const totalAmount = stone.pricePerUnit * squareFeet;
    const gstPercentage = this.billingService.getGSTPercentageForStoneType(stone.type);
    const gstAmount = (totalAmount * gstPercentage) / 100;

    const item: InvoiceItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      stoneId: stone.id,
      stoneName: stone.name,
      stoneType: stone.type,
      size: dimension,
      quantity: this.selectedQuantity,
      unit: 'pieces',
      squareFeet,
      pricePerUnit: stone.pricePerUnit,
      gstPercentage,
      gstAmount,
      totalAmount
    };

    this.invoiceItems.push(item);
    this.selectedQuantity = 1;
    this.updateItemAvailability();
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

    let invoice: Invoice;
    try {
      invoice = this.billingService.createInvoice(
        this.customerName,
        this.invoiceItems,
        this.discount,
        this.notes,
        this.billType
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invoice could not be created.';
      alert(message);
      this.updateAvailableStones();
      this.updateItemAvailability();
      return;
    }

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
    this.billType = 'cash';
    this.invoiceItems = [];
    this.discount = 0;
    this.notes = '';
    this.showInvoiceForm = false;
    this.selectedStone = '';
    this.selectedSizeId = '';
    this.selectedQuantity = 1;
    this.itemAvailability = null;
    this.stoneSearch = '';
    this.stoneTypeFilter = 'all';
    this.customWidth = 4;
    this.customHeight = 4;
    this.availabilityCheckError = '';
  }

  viewInvoice(invoice: Invoice): void {
    this.selectedInvoice = invoice;
    this.showInvoiceDetails = true;
  }

  printInvoice(invoice: Invoice): void {
    const html = this.billingService.exportInvoiceAsHtml(invoice);
    const printWindow = window.open('', '_blank', 'width=1100,height=800');

    if (!printWindow) {
      alert('Popup blocked. Please allow popups to print the invoice.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    let printStarted = false;
    const startPrint = () => {
      if (printStarted || printWindow.closed) {
        return;
      }

      printStarted = true;
      printWindow.focus();
      printWindow.print();
    };
    const pendingImages = Array.from(printWindow.document.images).filter(image => !image.complete);

    if (pendingImages.length === 0) {
      setTimeout(startPrint, 100);
      return;
    }

    let remainingImages = pendingImages.length;
    const imageFinished = () => {
      remainingImages -= 1;
      if (remainingImages === 0) {
        setTimeout(startPrint, 100);
      }
    };

    pendingImages.forEach(image => {
      image.addEventListener('load', imageFinished, { once: true });
      image.addEventListener('error', imageFinished, { once: true });
    });

    setTimeout(startPrint, 1800);
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
      const deleted = this.billingService.deleteInvoice(invoiceId);
      if (!deleted) {
        alert('The invoice could not be deleted because its stock could not be restored.');
        return;
      }
      this.updateAvailableStones();
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

  trackStone(_: number, stone: Stone): string {
    return stone.id;
  }

  trackSize(_: number, size: StoneSize): string {
    return size.id;
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

  private parseDimension(dimension: string): { width: number; height: number } | null {
    const parts = dimension
      .toLowerCase()
      .replace(/\s/g, '')
      .split('x')
      .map(value => Number(value));

    if (parts.length !== 2 || parts.some(value => !Number.isFinite(value) || value <= 0)) return null;
    return { width: parts[0], height: parts[1] };
  }

  private normaliseDimension(dimension: string): string {
    const parsed = this.parseDimension(dimension);
    return parsed ? `${this.formatDimension(parsed.width)}x${this.formatDimension(parsed.height)}` : dimension.toLowerCase().replace(/\s/g, '');
  }

  private clampDimension(value: number): number {
    if (!Number.isFinite(value)) value = this.quarterStep;
    return Math.min(this.boardMaxDimension, Math.max(this.quarterStep, this.snapQuarter(value)));
  }

  private snapQuarter(value: number): number {
    return Math.round(value / this.quarterStep) * this.quarterStep;
  }

  formatDimension(value: number): string {
    return Number(value.toFixed(2)).toString();
  }
}
