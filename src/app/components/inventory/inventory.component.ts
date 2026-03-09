import { Component, OnInit } from '@angular/core';
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
export class InventoryComponent implements OnInit {
  stones$: any;
  presetSizes = PRESET_SIZES;

  showForm = false;
  editingStoneId: string | null = null;

  checkStoneId = '';
  checkSize = '';
  checkQuantity = 1;
  availabilityResult: CuttingAvailabilityResult | null = null;
  bulkUploadSummary = '';

  formData: Partial<Stone> = this.getEmptyForm();

  constructor(private inventoryService: InventoryService) {
    this.stones$ = this.inventoryService.stones$;
  }

  ngOnInit(): void {
    console.log('Inventory component loaded');
  }

  getEmptyForm(): Partial<Stone> {
    return {
      name: '',
      type: '',
      color: '',
      pricePerUnit: 0,
      stockQuantity: 0,
      supplier: '',
      sizes: [...PRESET_SIZES],
      description: ''
    };
  }

  openForm(): void {
    this.showForm = true;
    this.editingStoneId = null;
    this.formData = this.getEmptyForm();
  }

  editStone(stone: Stone): void {
    this.editingStoneId = stone.id;
    this.formData = { ...stone, sizes: [...stone.sizes] };
    this.showForm = true;
  }

  saveStone(): void {
    if (!this.formData.name || !this.formData.type) {
      alert('Please fill in all required fields');
      return;
    }

    const stone: Stone = {
      id: this.editingStoneId || '',
      name: this.formData.name || '',
      type: this.formData.type || '',
      color: this.formData.color || '',
      pricePerUnit: this.formData.pricePerUnit || 0,
      stockQuantity: this.formData.stockQuantity || 0,
      supplier: this.formData.supplier || '',
      sizes: this.formData.sizes || [],
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
    this.formData = this.getEmptyForm();
  }

  updateSizeQuantity(sizeId: string, quantity: number): void {
    if (this.formData.sizes) {
      const size = this.formData.sizes.find(s => s.id === sizeId);
      if (size) {
        size.quantity = quantity;
      }
    }
  }

  getLowStockStones(): Stone[] {
    return this.inventoryService.getLowStockStones(20);
  }

  runAvailabilityCheck(): void {
    if (!this.checkStoneId || !this.checkSize || this.checkQuantity <= 0) {
      alert('Please select stone, size and required quantity');
      return;
    }

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

    const csv = `${headers.join(',')}\n${sampleRow.join(',')}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stock-upload-template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  handleBulkUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const rows = this.parseCSV(text);

      if (rows.length === 0) {
        alert('No rows found in uploaded file.');
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
        const stockQuantity = Number.isFinite(stockRaw) && stockRaw >= 0 ? stockRaw : summedStock;

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
      input.value = '';
    };

    reader.onerror = () => {
      alert('Unable to read uploaded file. Please check file format.');
      input.value = '';
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
