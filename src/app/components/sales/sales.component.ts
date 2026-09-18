import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SalesEntry } from '../../models/transaction.model';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css']
})
export class SalesComponent {
  readonly salesEntries$;

  searchTerm = '';
  billTypeFilter: 'all' | 'cash' | 'credit' = 'all';
  paymentFilter: 'all' | 'pending' | 'paid' | 'partial' = 'all';
  expandedSaleId: string | null = null;

  constructor(private transactionService: TransactionService) {
    this.salesEntries$ = this.transactionService.salesEntries$;
  }

  get filteredSales(): SalesEntry[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.salesEntries$().filter(entry => {
      const matchesSearch =
        !query ||
        entry.billNumber.toLowerCase().includes(query) ||
        entry.customerName.toLowerCase().includes(query) ||
        entry.items.some(
          item =>
            item.stoneName.toLowerCase().includes(query) ||
            item.stoneType.toLowerCase().includes(query)
        );
      const matchesBillType = this.billTypeFilter === 'all' || entry.billType === this.billTypeFilter;
      const matchesPayment = this.paymentFilter === 'all' || entry.paymentStatus === this.paymentFilter;

      return matchesSearch && matchesBillType && matchesPayment;
    });
  }

  get totalBilled(): number {
    return this.salesEntries$().reduce((total, entry) => total + entry.grandTotal, 0);
  }

  get paidCount(): number {
    return this.salesEntries$().filter(entry => entry.paymentStatus === 'paid').length;
  }

  get outstandingCount(): number {
    return this.salesEntries$().filter(entry => entry.paymentStatus !== 'paid').length;
  }

  get averageSale(): number {
    const entries = this.salesEntries$();
    return entries.length > 0 ? this.totalBilled / entries.length : 0;
  }

  getItemCount(entry: SalesEntry): number {
    return entry.items.reduce((total, item) => total + item.quantity, 0);
  }

  toggleSale(entryId: string): void {
    this.expandedSaleId = this.expandedSaleId === entryId ? null : entryId;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.billTypeFilter = 'all';
    this.paymentFilter = 'all';
  }

  trackSale(_index: number, entry: SalesEntry): string {
    return entry.id;
  }
}
