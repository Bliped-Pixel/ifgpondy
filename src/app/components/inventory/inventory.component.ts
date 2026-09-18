import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CuttingAvailabilityResult, InventoryService } from '../../services/inventory.service';
import { Stone, PRESET_SIZES } from '../../models/stone.model';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent {
  stones$: any;
  presetSizes = PRESET_SIZES;
  readonly lowStockThreshold = 20;

  showForm = false;
  editingStoneId: string | null = null;
  formError = '';

  inventorySearch = '';
  inventoryTypeFilter = 'all';
  inventoryStockFilter: 'all' | 'healthy' | 'low' | 'out' = 'all';

  checkStoneId = '';
  checkSize = '';
  checkQuantity = 1;
  availabilityResult: CuttingAvailabilityResult | null = null;
  checkerError = '';

  bulkUploadSummary = '';
  bulkUploadError = '';
  bulkUploadFileName = '';
  isBulkDragging = false;

  formData: Partial<Stone> = this.getEmptyForm();

  constructor(private inventoryService: InventoryService) {
    this.stones$ = this.inventoryService.stones$;
  }

  getEmptyForm(): Partial<Stone> {
    return {
      name: '',
      type: '',
      color: '',
      pricePerUnit: 0,
      stockQuantity: 0,
      supplier: '',
      sizes: PRESET_SIZES.map(size => ({ ...size })),
      description: ''
    };
  }

  openForm(): void {
    this.showForm = true;
    this.editingStoneId = null;
    this.formError = '';
    this.formData = this.getEmptyForm();
  }

  editStone(stone: Stone): void {
    this.editingStoneId = stone.id;
    this.formError = '';
    this.formData = { ...stone, sizes: stone.sizes.map(size => ({ ...size })) };
    this.showForm = true;
  }

  saveStone(): void {
    if (!this.formData.name || !this.formData.type) {
      this.formError = 'Stone name and material type are required.';
      return;
    }

    this.formError = '';
    const sizes = (this.formData.sizes || []).map(size => ({
      ...size,
      quantity: Math.max(0, Math.floor(Number(size.quantity) || 0))
    }));

    const stone: Stone = {
      id: this.editingStoneId || '',
      name: this.formData.name || '',
      type: this.formData.type || '',
      color: this.formData.color || '',
      pricePerUnit: Math.max(0, Number(this.formData.pricePerUnit) || 0),
      stockQuantity: Math.max(0, Math.floor(Number(this.formData.stockQuantity) || 0)),
      supplier: this.formData.supplier || '',
      sizes,
      lastRestocked: this.editingStoneId ? new Date(this.formData.lastRestocked!) : new Date(),
      description: this.formData.description
    };

    if (this.editingStoneId) {
      this.inventoryService.updateStone(stone);
    } else {
      this.inventoryService.addStone(stone);
    }

    this.cancelForm();
  }

  deleteStone(stoneId: string): void {
    if (confirm('Are you sure you want to delete this stone?')) {
      this.inventoryService.deleteStone(stoneId);
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingStoneId = null;
    this.formError = '';
    this.formData = this.getEmptyForm();
  }

  updateSizeQuantity(sizeId: string, quantity: number): void {
    if (this.formData.sizes) {
      const size = this.formData.sizes.find(s => s.id === sizeId);
      if (size) {
        size.quantity = Math.max(0, Math.floor(Number(quantity) || 0));
        this.formData.stockQuantity = this.getFormStockTotal();
      }
    }
  }

  getFormStockTotal(): number {
    return (this.formData.sizes || []).reduce(
      (total, size) => total + Math.max(0, Number(size.quantity) || 0),
      0
    );
  }

  getLowStockStones(): Stone[] {
    return this.inventoryService.getLowStockStones(this.lowStockThreshold);
  }

  get totalStockUnits(): number {
    return this.stones$().reduce(
      (total: number, stone: Stone) => total + Math.max(0, Number(stone.stockQuantity) || 0),
      0
    );
  }

  get supplierCount(): number {
    return new Set(
      this.stones$()
        .map((stone: Stone) => stone.supplier.trim().toLowerCase())
        .filter(Boolean)
    ).size;
  }

  get stoneTypes(): string[] {
    return Array.from(
      new Set<string>(this.stones$().map((stone: Stone) => stone.type).filter(Boolean))
    ).sort();
  }

  get filteredStones(): Stone[] {
    const query = this.inventorySearch.trim().toLowerCase();

    return this.stones$().filter((stone: Stone) => {
      const matchesSearch =
        !query ||
        stone.name.toLowerCase().includes(query) ||
        stone.type.toLowerCase().includes(query) ||
        stone.color.toLowerCase().includes(query) ||
        stone.supplier.toLowerCase().includes(query);
      const matchesType = this.inventoryTypeFilter === 'all' || stone.type === this.inventoryTypeFilter;
      const status = this.getStockStatus(stone);
      const matchesStock = this.inventoryStockFilter === 'all' || status === this.inventoryStockFilter;

      return matchesSearch && matchesType && matchesStock;
    });
  }

  getStockStatus(stone: Stone): 'healthy' | 'low' | 'out' {
    if (stone.stockQuantity <= 0) return 'out';
    if (stone.stockQuantity <= this.lowStockThreshold) return 'low';
    return 'healthy';
  }

  getStockStatusLabel(stone: Stone): string {
    const status = this.getStockStatus(stone);
    return status === 'healthy' ? 'In stock' : status === 'low' ? 'Low stock' : 'Out of stock';
  }

  getStockedSizes(stone: Stone): Stone['sizes'] {
    return stone.sizes.filter(size => size.quantity > 0);
  }

  getStoneBackground(stone: Stone): string {
    const name = `${stone.name}-${stone.type}-${stone.color}`;
    let hash = 0;
    for (let index = 0; index < name.length; index += 1) {
      hash = name.charCodeAt(index) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;

    return `
      radial-gradient(circle at 24% 22%, hsla(${hue}, 18%, 95%, .72) 0 8%, transparent 9%),
      radial-gradient(circle at 72% 66%, hsla(${(hue + 32) % 360}, 14%, 18%, .2) 0 7%, transparent 8%),
      linear-gradient(125deg, hsl(${hue}, 10%, 42%), hsl(${(hue + 16) % 360}, 9%, 74%) 50%, hsl(${hue}, 9%, 34%))
    `;
  }

  trackStone(_index: number, stone: Stone): string {
    return stone.id;
  }

  trackSize(_index: number, size: { id: string }): string {
    return size.id;
  }

  runAvailabilityCheck(): void {
    if (!this.checkStoneId || !this.checkSize || this.checkQuantity <= 0) {
      this.checkerError = 'Choose a stone, enter a size such as 3x2, and set a quantity above zero.';
      return;
    }

    this.checkerError = '';
    this.availabilityResult = this.inventoryService.getCuttingAvailability(
      this.checkStoneId,
      this.checkSize,
      this.checkQuantity
    );
  }

  clearAvailabilityCheck(): void {
    this.checkStoneId = '';
    this.checkSize = '';
    this.checkQuantity = 1;
    this.availabilityResult = null;
    this.checkerError = '';
  }

  downloadBulkTemplate(): void {
    const sizeHeaders = this.presetSizes.map(size => `size_${size.dimension}`);
    const headers = [
      'name',
      'type',
      'color',
      'pricePerUnit',
      'supplier',
      'description',
      'stockQuantity',
      ...sizeHeaders
    ];

    const sampleRow = [
      'Sample Black Granite',
      'Granite',
      'Black',
      '500',
      'XYZ Suppliers',
      'Premium polished stone',
      '',
      ...this.presetSizes.map(size => (size.dimension === '6x6' ? '10' : '0'))
    ];

    const csv = `\uFEFF${headers.join(',')}\n${sampleRow.join(',')}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stock-upload-template.csv';
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  handleBulkUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.importBulkFile(file, () => {
      input.value = '';
    });
  }

  onBulkDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isBulkDragging = true;
  }

  onBulkDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isBulkDragging = false;
  }

  onBulkDrop(event: DragEvent): void {
    event.preventDefault();
    this.isBulkDragging = false;

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.importBulkFile(file);
    }
  }

  private importBulkFile(file: File, onComplete?: () => void): void {
    this.bulkUploadSummary = '';
    this.bulkUploadError = '';
    this.bulkUploadFileName = file.name;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.bulkUploadError = 'Please upload a CSV file. The template opens directly in Excel.';
      onComplete?.();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '').replace(/^\uFEFF/, '');
      const rows = this.parseCSV(text);

      if (rows.length === 0) {
        this.bulkUploadError = 'No inventory rows were found in this file.';
        onComplete?.();
        return;
      }

      let created = 0;
      let updated = 0;
      let skipped = 0;

      rows.forEach(row => {
        const name = (row['name'] || '').trim();
        const type = (row['type'] || '').trim();

        if (!name || !type) {
          skipped += 1;
          return;
        }

        const sizes = this.presetSizes.map(size => {
          const quantityRaw = row[`size_${size.dimension}`] || '0';
          const quantity = Number(quantityRaw);
          return {
            ...size,
            quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 0
          };
        });

        const summedStock = sizes.reduce((sum, size) => sum + size.quantity, 0);
        const stockRaw = Number(row['stockQuantity']);
        const stockQuantity =
          summedStock > 0 ? summedStock : Number.isFinite(stockRaw) && stockRaw >= 0 ? stockRaw : 0;

        const existingStone = this.stones$().find(
          (stone: Stone) =>
            stone.name.trim().toLowerCase() === name.toLowerCase() &&
            stone.type.trim().toLowerCase() === type.toLowerCase()
        );

        const stone: Stone = {
          id: existingStone?.id || '',
          name,
          type,
          color: (row['color'] || '').trim(),
          pricePerUnit: Number(row['pricePerUnit']) || 0,
          stockQuantity,
          supplier: (row['supplier'] || '').trim(),
          sizes,
          lastRestocked: new Date(),
          description: (row['description'] || '').trim()
        };

        if (existingStone) {
          this.inventoryService.updateStone(stone);
          updated += 1;
        } else {
          this.inventoryService.addStone(stone);
          created += 1;
        }
      });

      this.bulkUploadSummary = `Bulk upload complete: ${created} created, ${updated} updated, ${skipped} skipped.`;
      onComplete?.();
    };

    reader.onerror = () => {
      this.bulkUploadError = 'The file could not be read. Download a fresh template and try again.';
      onComplete?.();
    };

    reader.readAsText(file);
  }

  private parseCSV(csv: string): Array<{ [key: string]: string }> {
    const lines = csv
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length < 2) {
      return [];
    }

    const headers = this.parseCSVLine(lines[0]).map(header => header.trim());
    const rows: Array<{ [key: string]: string }> = [];

    for (let index = 1; index < lines.length; index += 1) {
      const values = this.parseCSVLine(lines[index]);
      const row: { [key: string]: string } = {};

      headers.forEach((header, headerIndex) => {
        row[header] = (values[headerIndex] || '').trim();
      });

      rows.push(row);
    }

    return rows;
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const nextChar = line[index + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current);
    return values;
  }
}
