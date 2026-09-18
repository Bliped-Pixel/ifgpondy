import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BillingService } from '../services/billing.service';
import { InventoryService } from '../services/inventory.service';
import { TransactionService } from '../services/transaction.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  private readonly inventoryService = inject(InventoryService);
  private readonly billingService = inject(BillingService);
  private readonly transactionService = inject(TransactionService);

  readonly stones = this.inventoryService.stones$;
  readonly invoices = this.billingService.invoices$;
  readonly purchases = this.transactionService.purchaseEntries$;

  readonly totalPieces = computed(() =>
    this.stones().reduce((total, stone) => total + stone.stockQuantity, 0)
  );

  readonly activeMaterials = computed(() =>
    this.stones().filter(stone => stone.stockQuantity > 0).length
  );

  readonly stockedSizes = computed(() =>
    this.stones().reduce(
      (total, stone) => total + stone.sizes.filter(size => size.quantity > 0).length,
      0
    )
  );

  readonly lowStockStones = computed(() =>
    [...this.stones()]
      .filter(stone => stone.stockQuantity > 0 && stone.stockQuantity <= 20)
      .sort((a, b) => a.stockQuantity - b.stockQuantity)
      .slice(0, 4)
  );

  readonly totalBilled = computed(() =>
    this.invoices().reduce((total, invoice) => total + invoice.total, 0)
  );

  readonly outstandingAmount = computed(() =>
    this.invoices()
      .filter(invoice => invoice.paymentStatus !== 'paid')
      .reduce((total, invoice) => total + invoice.total, 0)
  );

  readonly recentInvoices = computed(() =>
    [...this.invoices()]
      .sort(
        (a, b) =>
          new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
      )
      .slice(0, 4)
  );
}
