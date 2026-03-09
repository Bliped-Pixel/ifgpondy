import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../services/catalog.service';
import { Stone } from '../../models/stone.model';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css']
})
export class CatalogComponent implements OnInit {
  stones: Stone[] = [];
  filteredStones: Stone[] = [];

  types: string[] = [];
  colors: string[] = [];
  priceRange: { min: number; max: number } = { min: 0, max: 0 };

  selectedType: string = '';
  selectedColor: string = '';
  selectedMinPrice: number = 0;
  selectedMaxPrice: number = 10000;
  searchQuery: string = '';

  viewMode: 'grid' | 'list' = 'grid';

  constructor(private catalogService: CatalogService) {}

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.stones = this.catalogService.getPublicCatalog();
    this.filteredStones = this.stones;

    this.types = this.catalogService.getStoneTypes();
    this.colors = this.catalogService.getStoneColors();
    this.priceRange = this.catalogService.getStonePriceRange();

    this.selectedMinPrice = this.priceRange.min;
    this.selectedMaxPrice = this.priceRange.max;
  }

  applyFilters(): void {
    let filtered = this.stones;

    if (this.selectedType) {
      filtered = filtered.filter(stone => stone.type === this.selectedType);
    }

    if (this.selectedColor) {
      filtered = filtered.filter(stone => stone.color === this.selectedColor);
    }

    filtered = filtered.filter(
      stone =>
        stone.pricePerUnit >= this.selectedMinPrice &&
        stone.pricePerUnit <= this.selectedMaxPrice
    );

    if (this.searchQuery) {
      filtered = this.catalogService.searchStones(this.searchQuery);
    }

    this.filteredStones = filtered;
  }

  search(): void {
    if (this.searchQuery) {
      this.filteredStones = this.catalogService.searchStones(this.searchQuery);
    } else {
      this.applyFilters();
    }
  }

  resetFilters(): void {
    this.selectedType = '';
    this.selectedColor = '';
    this.selectedMinPrice = this.priceRange.min;
    this.selectedMaxPrice = this.priceRange.max;
    this.searchQuery = '';
    this.filteredStones = this.stones;
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  getAverageRating(): number {
    return 4.5; // Placeholder for ratings
  }

  contactForOrder(stoneName: string): void {
    alert(`Thank you for your interest in ${stoneName}! Contact us for ordering details.`);
  }
}
