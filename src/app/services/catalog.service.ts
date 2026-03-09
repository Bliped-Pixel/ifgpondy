import { Injectable } from '@angular/core';
import { InventoryService } from './inventory.service';
import { Stone } from '../models/stone.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  constructor(private inventoryService: InventoryService) {}

  getPublicCatalog(): Stone[] {
    return this.inventoryService.getAvailableStones();
  }

  searchStones(query: string): Stone[] {
    const lowerQuery = query.toLowerCase();
    return this.getPublicCatalog().filter(
      stone =>
        stone.name.toLowerCase().includes(lowerQuery) ||
        stone.type.toLowerCase().includes(lowerQuery) ||
        stone.color.toLowerCase().includes(lowerQuery)
    );
  }

  filterByType(type: string): Stone[] {
    return this.getPublicCatalog().filter(stone => stone.type === type);
  }

  filterByColor(color: string): Stone[] {
    return this.getPublicCatalog().filter(stone => stone.color === color);
  }

  filterByPriceRange(minPrice: number, maxPrice: number): Stone[] {
    return this.getPublicCatalog().filter(
      stone => stone.pricePerUnit >= minPrice && stone.pricePerUnit <= maxPrice
    );
  }

  getStoneTypes(): string[] {
    const types = new Set(this.getPublicCatalog().map(s => s.type));
    return Array.from(types);
  }

  getStoneColors(): string[] {
    const colors = new Set(this.getPublicCatalog().map(s => s.color));
    return Array.from(colors);
  }

  getStonePriceRange(): { min: number; max: number } {
    const stones = this.getPublicCatalog();
    if (stones.length === 0) return { min: 0, max: 0 };
    const prices = stones.map(s => s.pricePerUnit);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }
}
