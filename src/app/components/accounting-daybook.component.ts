import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../services/billing.service';
import { TransactionService } from '../services/transaction.service';

type JournalSource = 'sales' | 'purchase' | 'receipt' | 'payment' | 'contra' | 'invoice';
type FilterSource = JournalSource | 'all';

interface JournalEntry {
  id: string;
  date: Date;
  refNo: string;
  source: JournalSource;
  ledger: string;
  party: string;
  debit: number;
  credit: number;
  narration: string;
}

interface LedgerSummary {
  ledger: string;
  debit: number;
  credit: number;
  balance: number;
  entries: number;
}

@Component({
  selector: 'app-accounting-daybook',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container">
      <header class="header">
        <h2>Day Book & Ledger</h2>
        <p>Access parity module for <code>day_book</code> and <code>ledgerform</code>.</p>
      </header>

      <section class="filters">
        <label>
          Entry Type
          <select [ngModel]="sourceFilter()" (ngModelChange)="sourceFilter.set($event)">
            <option value="all">All</option>
            <option value="sales">Sales</option>
            <option value="purchase">Purchase</option>
            <option value="receipt">Receipt</option>
            <option value="payment">Payment</option>
            <option value="contra">Contra</option>
            <option value="invoice">Invoice</option>
          </select>
        </label>

        <label>
          From Date
          <input type="date" [ngModel]="fromDate()" (ngModelChange)="fromDate.set($event)" />
        </label>

        <label>
          To Date
          <input type="date" [ngModel]="toDate()" (ngModelChange)="toDate.set($event)" />
        </label>

        <label>
          Search Party / Ledger
          <input
            type="search"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            placeholder="customer, supplier, ledger"
          />
        </label>
      </section>

      <section class="totals">
        <article>
          <h4>Debit Total</h4>
          <p>INR {{ debitTotal().toFixed(2) }}</p>
        </article>
        <article>
          <h4>Credit Total</h4>
          <p>INR {{ creditTotal().toFixed(2) }}</p>
        </article>
        <article>
          <h4>Balance</h4>
          <p>INR {{ (debitTotal() - creditTotal()).toFixed(2) }}</p>
        </article>
      </section>

      <section class="panel">
        <h3>Day Book</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Ref No.</th>
              <th>Source</th>
              <th>Party</th>
              <th>Ledger</th>
              <th>Narration</th>
              <th>Debit</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of filteredEntries()">
              <td>{{ row.date | date: 'dd/MM/yyyy' }}</td>
              <td>{{ row.refNo }}</td>
              <td>{{ row.source | uppercase }}</td>
              <td>{{ row.party }}</td>
              <td>{{ row.ledger }}</td>
              <td>{{ row.narration }}</td>
              <td>INR {{ row.debit.toFixed(2) }}</td>
              <td>INR {{ row.credit.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
        <p class="empty" *ngIf="filteredEntries().length === 0">No entries found for current filters.</p>
      </section>

      <section class="panel">
        <h3>Ledger Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Ledger</th>
              <th>Entries</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Balance (Dr - Cr)</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ledger of ledgerSummary()">
              <td>{{ ledger.ledger }}</td>
              <td>{{ ledger.entries }}</td>
              <td>INR {{ ledger.debit.toFixed(2) }}</td>
              <td>INR {{ ledger.credit.toFixed(2) }}</td>
              <td>INR {{ ledger.balance.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  `,
  styles: [
    `
      .container {
        max-width: 1300px;
        margin: 0 auto;
        padding: 20px;
      }

      .header h2 {
        margin: 0 0 4px;
      }

      .filters,
      .panel {
        border: 1px solid #e8e8e8;
        border-radius: 10px;
        background: #fff;
        padding: 14px;
        margin-bottom: 14px;
      }

      .filters {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 10px;
      }

      label {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 13px;
      }

      input,
      select {
        border: 1px solid #cfcfcf;
        border-radius: 8px;
        padding: 8px;
        font: inherit;
      }

      .totals {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 10px;
        margin-bottom: 14px;
      }

      .totals article {
        border: 1px solid #dbe6f7;
        border-radius: 10px;
        background: #f3f8ff;
        padding: 10px;
      }

      .totals h4 {
        margin: 0 0 4px;
        font-size: 13px;
      }

      .totals p {
        margin: 0;
        font-weight: 700;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        border: 1px solid #ececec;
        padding: 8px;
        text-align: left;
      }

      th {
        background: #f8f8f8;
      }

      .empty {
        margin: 10px 0 0;
      }
    `
  ]
})
export class AccountingDaybookComponent {
  private readonly transactionService = inject(TransactionService);
  private readonly billingService = inject(BillingService);

  readonly sourceFilter = signal<FilterSource>('all');
  readonly fromDate = signal('');
  readonly toDate = signal('');
  readonly searchTerm = signal('');

  readonly journalEntries = computed<JournalEntry[]>(() => {
    const sales = this.transactionService.salesEntries$().map(entry => ({
      id: `sales-${entry.id}`,
      date: new Date(entry.salesDate),
      refNo: entry.billNumber,
      source: 'sales' as const,
      ledger: 'Sales A/C',
      party: entry.customerName,
      debit: 0,
      credit: entry.grandTotal,
      narration: entry.notes || 'Sales entry posted'
    }));

    const purchases = this.transactionService.purchaseEntries$().map(entry => ({
      id: `purchase-${entry.id}`,
      date: new Date(entry.purchaseDate),
      refNo: entry.purchaseNumber,
      source: 'purchase' as const,
      ledger: 'Purchase A/C',
      party: entry.supplierName,
      debit: entry.grandTotal,
      credit: 0,
      narration: entry.notes || 'Purchase entry posted'
    }));

    const vouchers = this.transactionService.voucherEntries$().map(entry => {
      const isReceipt = entry.voucherType === 'receipt';
      const isContra = entry.voucherType === 'contra';

      return {
        id: `voucher-${entry.id}`,
        date: new Date(entry.voucherDate),
        refNo: entry.voucherNumber,
        source: entry.voucherType,
        ledger: entry.ledgerName,
        party: entry.partyName,
        debit: isReceipt || isContra ? entry.amount : 0,
        credit: entry.voucherType === 'payment' ? entry.amount : 0,
        narration: entry.note || 'Voucher posted'
      };
    });

    const invoices = this.billingService.invoices$().map(invoice => ({
      id: `invoice-${invoice.id}`,
      date: new Date(invoice.invoiceDate),
      refNo: invoice.invoiceNumber,
      source: 'invoice' as const,
      ledger: invoice.billType === 'credit' ? 'Sundry Debtors A/C' : 'Cash A/C',
      party: invoice.customerName,
      debit: 0,
      credit: invoice.total,
      narration: `${invoice.billType.toUpperCase()} bill created`
    }));

    return [...sales, ...purchases, ...vouchers, ...invoices].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
  });

  readonly filteredEntries = computed(() => {
    const sourceFilter = this.sourceFilter();
    const search = this.searchTerm().trim().toLowerCase();
    const from = this.fromDate() ? new Date(this.fromDate()) : null;
    const to = this.toDate() ? new Date(this.toDate()) : null;

    if (to) {
      to.setHours(23, 59, 59, 999);
    }

    return this.journalEntries().filter(entry => {
      const matchesType = sourceFilter === 'all' ? true : entry.source === sourceFilter;
      const matchesSearch =
        search.length === 0
          ? true
          : entry.party.toLowerCase().includes(search) ||
            entry.ledger.toLowerCase().includes(search) ||
            entry.refNo.toLowerCase().includes(search);
      const matchesFrom = from ? entry.date >= from : true;
      const matchesTo = to ? entry.date <= to : true;

      return matchesType && matchesSearch && matchesFrom && matchesTo;
    });
  });

  readonly debitTotal = computed(() =>
    this.filteredEntries().reduce((sum, entry) => sum + entry.debit, 0)
  );

  readonly creditTotal = computed(() =>
    this.filteredEntries().reduce((sum, entry) => sum + entry.credit, 0)
  );

  readonly ledgerSummary = computed<LedgerSummary[]>(() => {
    const map = new Map<string, LedgerSummary>();

    this.filteredEntries().forEach(entry => {
      const existing = map.get(entry.ledger) ?? {
        ledger: entry.ledger,
        debit: 0,
        credit: 0,
        balance: 0,
        entries: 0
      };

      const next: LedgerSummary = {
        ledger: existing.ledger,
        debit: existing.debit + entry.debit,
        credit: existing.credit + entry.credit,
        balance: existing.debit + entry.debit - (existing.credit + entry.credit),
        entries: existing.entries + 1
      };

      map.set(entry.ledger, next);
    });

    return Array.from(map.values()).sort((a, b) => a.ledger.localeCompare(b.ledger));
  });
}
