import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../services/transaction.service';

type ReportTab = 'trial-balance' | 'profit-loss' | 'balance-sheet';

const COMPANY = {
  name: 'INDO FRENCH GRANITES',
  gstin: '34ADYPA0680K1ZB',
  address: 'No.220/3H, Krishna Nagar Main Road, Lawspet, Puducherry - 605 008',
  contact: 'Shop: 0413-2255225, Cell: +91-94434 59929 | 94433 83039',
  email: 'ifgpondy@gmail.com'
};

type EntrySource = 'sales' | 'purchase' | 'receipt' | 'payment' | 'contra';

interface JournalEntry {
  source: EntrySource;
  ledger: string;
  debit: number;
  credit: number;
}

interface TrialBalanceRow {
  ledger: string;
  debit: number;
  credit: number;
}

interface LedgerNetBalance {
  ledger: string;
  net: number;
}

@Component({
  selector: 'app-accounting-reports',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container">
      <header class="header">
        <h2>Accounting Reports</h2>
        <p>Access parity module for <code>trial_balance_form</code>, <code>profit_loss_form</code>, and <code>balance_sheet</code>.</p>
      </header>

      <section class="tabs">
        <button type="button" [class.active]="activeTab() === 'trial-balance'" (click)="setTab('trial-balance')">
          Trial Balance
        </button>
        <button type="button" [class.active]="activeTab() === 'profit-loss'" (click)="setTab('profit-loss')">
          Profit & Loss
        </button>
        <button type="button" [class.active]="activeTab() === 'balance-sheet'" (click)="setTab('balance-sheet')">
          Balance Sheet
        </button>
      </section>

      <section class="toolbar">
        <button type="button" class="btn btn-primary" (click)="printActiveReport()">Print Current Report</button>
        <button type="button" class="btn btn-secondary" (click)="exportActiveReportCsv()">Export CSV</button>
      </section>

      <section class="panel" *ngIf="activeTab() === 'trial-balance'">
        <h3>Trial Balance</h3>
        <table>
          <thead>
            <tr>
              <th>Ledger</th>
              <th>Debit</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of trialBalanceRows()">
              <td>{{ row.ledger }}</td>
              <td>INR {{ row.debit.toFixed(2) }}</td>
              <td>INR {{ row.credit.toFixed(2) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th>Total</th>
              <th>INR {{ trialBalanceDebitTotal().toFixed(2) }}</th>
              <th>INR {{ trialBalanceCreditTotal().toFixed(2) }}</th>
            </tr>
          </tfoot>
        </table>
      </section>

      <section class="panel" *ngIf="activeTab() === 'profit-loss'">
        <h3>Profit & Loss</h3>

        <div class="summary-grid">
          <article>
            <h4>Total Income</h4>
            <p>INR {{ totalIncome().toFixed(2) }}</p>
          </article>
          <article>
            <h4>Total Expense</h4>
            <p>INR {{ totalExpense().toFixed(2) }}</p>
          </article>
          <article>
            <h4>Net Result</h4>
            <p [class.loss]="netProfit() < 0">INR {{ netProfit().toFixed(2) }}</p>
          </article>
        </div>

        <div class="pl-grid">
          <div>
            <h4>Income Ledgers</h4>
            <table>
              <thead>
                <tr>
                  <th>Ledger</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of incomeRows()">
                  <td>{{ row.ledger }}</td>
                  <td>INR {{ row.net.toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h4>Expense Ledgers</h4>
            <table>
              <thead>
                <tr>
                  <th>Ledger</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of expenseRows()">
                  <td>{{ row.ledger }}</td>
                  <td>INR {{ row.net.toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="panel" *ngIf="activeTab() === 'balance-sheet'">
        <h3>Balance Sheet</h3>

        <div class="summary-grid">
          <article>
            <h4>Total Assets</h4>
            <p>INR {{ totalAssets().toFixed(2) }}</p>
          </article>
          <article>
            <h4>Total Liabilities + Equity</h4>
            <p>INR {{ totalLiabilitiesAndEquity().toFixed(2) }}</p>
          </article>
          <article>
            <h4>Difference</h4>
            <p>INR {{ (totalAssets() - totalLiabilitiesAndEquity()).toFixed(2) }}</p>
          </article>
        </div>

        <div class="pl-grid">
          <div>
            <h4>Assets</h4>
            <table>
              <thead>
                <tr>
                  <th>Ledger</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of assetRows()">
                  <td>{{ row.ledger }}</td>
                  <td>INR {{ row.net.toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h4>Liabilities + Equity</h4>
            <table>
              <thead>
                <tr>
                  <th>Ledger</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of liabilityRows()">
                  <td>{{ row.ledger }}</td>
                  <td>INR {{ row.net.toFixed(2) }}</td>
                </tr>
                <tr>
                  <td>Current Period Profit</td>
                  <td>INR {{ netProfit().toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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
        margin: 0 0 6px;
      }

      .tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 14px;
      }

      .tabs button {
        border: 1px solid #cdd7ea;
        background: #f3f7ff;
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
      }

      .tabs button.active {
        background: #1f5faf;
        border-color: #1f5faf;
        color: #fff;
      }

      .panel {
        background: #fff;
        border: 1px solid #e8e8e8;
        border-radius: 10px;
        padding: 14px;
        margin-bottom: 12px;
      }

      .toolbar {
        display: flex;
        gap: 10px;
        margin-bottom: 12px;
      }

      .btn {
        border: none;
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
      }

      .btn-primary {
        background: #0f5e3a;
        color: #fff;
      }

      .btn-secondary {
        background: #556177;
        color: #fff;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        border: 1px solid #ececec;
        text-align: left;
        padding: 8px;
      }

      th {
        background: #f8f8f8;
      }

      tfoot th {
        background: #edf4ff;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 10px;
        margin-bottom: 12px;
      }

      .summary-grid article {
        border: 1px solid #dae7dd;
        background: #f5fff7;
        border-radius: 10px;
        padding: 10px;
      }

      .summary-grid h4 {
        margin: 0 0 4px;
        font-size: 13px;
      }

      .summary-grid p {
        margin: 0;
        font-weight: 700;
      }

      .summary-grid p.loss {
        color: #a90000;
      }

      .pl-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 12px;
      }
    `
  ]
})
export class AccountingReportsComponent {
  private readonly transactionService = inject(TransactionService);

  readonly activeTab = signal<ReportTab>('trial-balance');

  readonly journalEntries = computed<JournalEntry[]>(() => {
    const sales = this.transactionService.salesEntries$().map(entry => ({
      source: 'sales' as const,
      ledger: 'Sales A/C',
      debit: 0,
      credit: entry.grandTotal
    }));

    const purchases = this.transactionService.purchaseEntries$().map(entry => ({
      source: 'purchase' as const,
      ledger: 'Purchase A/C',
      debit: entry.grandTotal,
      credit: 0
    }));

    const vouchers = this.transactionService.voucherEntries$().map(entry => {
      if (entry.voucherType === 'receipt') {
        return {
          source: 'receipt' as const,
          ledger: entry.ledgerName,
          debit: entry.amount,
          credit: 0
        };
      }

      if (entry.voucherType === 'payment') {
        return {
          source: 'payment' as const,
          ledger: entry.ledgerName,
          debit: 0,
          credit: entry.amount
        };
      }

      return {
        source: 'contra' as const,
        ledger: entry.ledgerName,
        debit: entry.amount,
        credit: entry.amount
      };
    });

    return [...sales, ...purchases, ...vouchers];
  });

  readonly trialBalanceRows = computed<TrialBalanceRow[]>(() => {
    const grouped = this.groupLedgerBalances();

    return grouped
      .map(item => {
        if (item.net >= 0) {
          return { ledger: item.ledger, debit: item.net, credit: 0 };
        }

        return { ledger: item.ledger, debit: 0, credit: Math.abs(item.net) };
      })
      .sort((a, b) => a.ledger.localeCompare(b.ledger));
  });

  readonly trialBalanceDebitTotal = computed(() =>
    this.trialBalanceRows().reduce((sum, row) => sum + row.debit, 0)
  );

  readonly trialBalanceCreditTotal = computed(() =>
    this.trialBalanceRows().reduce((sum, row) => sum + row.credit, 0)
  );

  readonly incomeRows = computed(() =>
    this.groupLedgerBalances()
      .filter(item => this.isIncomeLedger(item.ledger))
      .map(item => ({ ledger: item.ledger, net: Math.max(0, -item.net) }))
      .filter(item => item.net > 0)
      .sort((a, b) => a.ledger.localeCompare(b.ledger))
  );

  readonly expenseRows = computed(() =>
    this.groupLedgerBalances()
      .filter(item => this.isExpenseLedger(item.ledger))
      .map(item => ({ ledger: item.ledger, net: Math.max(0, item.net) }))
      .filter(item => item.net > 0)
      .sort((a, b) => a.ledger.localeCompare(b.ledger))
  );

  readonly totalIncome = computed(() =>
    this.incomeRows().reduce((sum, row) => sum + row.net, 0)
  );

  readonly totalExpense = computed(() =>
    this.expenseRows().reduce((sum, row) => sum + row.net, 0)
  );

  readonly netProfit = computed(() => this.totalIncome() - this.totalExpense());

  readonly assetRows = computed(() =>
    this.groupLedgerBalances()
      .filter(item => this.isAssetLedger(item.ledger))
      .map(item => ({ ledger: item.ledger, net: Math.abs(item.net) }))
      .filter(item => item.net > 0)
      .sort((a, b) => a.ledger.localeCompare(b.ledger))
  );

  readonly liabilityRows = computed(() =>
    this.groupLedgerBalances()
      .filter(item => this.isLiabilityLedger(item.ledger))
      .map(item => ({ ledger: item.ledger, net: Math.abs(item.net) }))
      .filter(item => item.net > 0)
      .sort((a, b) => a.ledger.localeCompare(b.ledger))
  );

  readonly totalAssets = computed(() =>
    this.assetRows().reduce((sum, row) => sum + row.net, 0)
  );

  readonly totalLiabilitiesAndEquity = computed(() =>
    this.liabilityRows().reduce((sum, row) => sum + row.net, 0) + this.netProfit()
  );

  setTab(tab: ReportTab): void {
    this.activeTab.set(tab);
  }

  printActiveReport(): void {
    const html = this.buildPrintableReportHtml();
    const printWindow = window.open('', '_blank', 'width=1100,height=850');

    if (!printWindow) {
      alert('Popup blocked. Please allow popups to print reports.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 200);
  }

  exportActiveReportCsv(): void {
    const csv = this.buildReportCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${this.getReportTitle(this.activeTab()).replace(/\s+/g, '_').toLowerCase()}.csv`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  private groupLedgerBalances(): LedgerNetBalance[] {
    const map = new Map<string, number>();

    this.journalEntries().forEach(entry => {
      const current = map.get(entry.ledger) ?? 0;
      map.set(entry.ledger, current + (entry.debit - entry.credit));
    });

    return Array.from(map.entries()).map(([ledger, net]) => ({ ledger, net }));
  }

  private isIncomeLedger(ledger: string): boolean {
    return /sales|income|commission|receipt|discount received/i.test(ledger);
  }

  private isExpenseLedger(ledger: string): boolean {
    return /purchase|expense|salary|rent|wages|freight|electricity|labour/i.test(ledger);
  }

  private isAssetLedger(ledger: string): boolean {
    return /cash|bank|stock|inventory|debtor|receivable|advance/i.test(ledger);
  }

  private isLiabilityLedger(ledger: string): boolean {
    return /creditor|payable|loan|capital|gst|tax|duties/i.test(ledger);
  }

  private buildPrintableReportHtml(): string {
    const title = this.getReportTitle(this.activeTab());
    const reportDate = new Date().toLocaleDateString('en-IN');
    const body = this.getPrintableBody(this.activeTab());

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
            .header { border-bottom: 2px solid #111; margin-bottom: 12px; padding-bottom: 10px; }
            .row { display: flex; justify-content: space-between; gap: 10px; }
            .company { text-align: center; }
            .company h1 { margin: 2px 0; font-size: 30px; }
            .company h2 { margin: 0 0 6px; font-size: 22px; text-decoration: underline; }
            .muted { font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #111; padding: 6px; font-size: 12px; text-align: left; }
            th { background: #f1f1f1; }
          </style>
        </head>
        <body>
          <header class="header">
            <div class="row">
              <strong>GSTIN: ${COMPANY.gstin}</strong>
              <strong>Date: ${reportDate}</strong>
            </div>
            <div class="company">
              <h2>${title}</h2>
              <h1>${COMPANY.name}</h1>
              <div>${COMPANY.address}</div>
              <div>${COMPANY.contact} | ${COMPANY.email}</div>
            </div>
          </header>
          ${body}
        </body>
      </html>
    `;
  }

  private getPrintableBody(tab: ReportTab): string {
    if (tab === 'trial-balance') {
      const rows = this.trialBalanceRows()
        .map(row => `<tr><td>${row.ledger}</td><td>${row.debit.toFixed(2)}</td><td>${row.credit.toFixed(2)}</td></tr>`)
        .join('');

      return `
        <table>
          <thead><tr><th>Ledger</th><th>Debit</th><th>Credit</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><th>Total</th><th>${this.trialBalanceDebitTotal().toFixed(2)}</th><th>${this.trialBalanceCreditTotal().toFixed(2)}</th></tr></tfoot>
        </table>
      `;
    }

    if (tab === 'profit-loss') {
      const incomeRows = this.incomeRows()
        .map(row => `<tr><td>${row.ledger}</td><td>${row.net.toFixed(2)}</td></tr>`)
        .join('');
      const expenseRows = this.expenseRows()
        .map(row => `<tr><td>${row.ledger}</td><td>${row.net.toFixed(2)}</td></tr>`)
        .join('');

      return `
        <h3>Income</h3>
        <table><thead><tr><th>Ledger</th><th>Amount</th></tr></thead><tbody>${incomeRows}</tbody></table>
        <h3>Expense</h3>
        <table><thead><tr><th>Ledger</th><th>Amount</th></tr></thead><tbody>${expenseRows}</tbody></table>
        <p><strong>Total Income:</strong> ${this.totalIncome().toFixed(2)}</p>
        <p><strong>Total Expense:</strong> ${this.totalExpense().toFixed(2)}</p>
        <p><strong>Net Result:</strong> ${this.netProfit().toFixed(2)}</p>
      `;
    }

    const assets = this.assetRows()
      .map(row => `<tr><td>${row.ledger}</td><td>${row.net.toFixed(2)}</td></tr>`)
      .join('');
    const liabilities = this.liabilityRows()
      .map(row => `<tr><td>${row.ledger}</td><td>${row.net.toFixed(2)}</td></tr>`)
      .join('');

    return `
      <h3>Assets</h3>
      <table><thead><tr><th>Ledger</th><th>Amount</th></tr></thead><tbody>${assets}</tbody></table>
      <h3>Liabilities + Equity</h3>
      <table>
        <thead><tr><th>Ledger</th><th>Amount</th></tr></thead>
        <tbody>${liabilities}<tr><td>Current Period Profit</td><td>${this.netProfit().toFixed(2)}</td></tr></tbody>
      </table>
      <p><strong>Total Assets:</strong> ${this.totalAssets().toFixed(2)}</p>
      <p><strong>Total Liabilities + Equity:</strong> ${this.totalLiabilitiesAndEquity().toFixed(2)}</p>
    `;
  }

  private buildReportCsv(): string {
    const tab = this.activeTab();

    if (tab === 'trial-balance') {
      const lines = ['Ledger,Debit,Credit'];
      this.trialBalanceRows().forEach(row => {
        lines.push(`${this.escapeCsv(row.ledger)},${row.debit.toFixed(2)},${row.credit.toFixed(2)}`);
      });
      lines.push(`Total,${this.trialBalanceDebitTotal().toFixed(2)},${this.trialBalanceCreditTotal().toFixed(2)}`);
      return lines.join('\n');
    }

    if (tab === 'profit-loss') {
      const lines = ['Section,Ledger,Amount'];
      this.incomeRows().forEach(row => {
        lines.push(`Income,${this.escapeCsv(row.ledger)},${row.net.toFixed(2)}`);
      });
      this.expenseRows().forEach(row => {
        lines.push(`Expense,${this.escapeCsv(row.ledger)},${row.net.toFixed(2)}`);
      });
      lines.push(`Summary,Total Income,${this.totalIncome().toFixed(2)}`);
      lines.push(`Summary,Total Expense,${this.totalExpense().toFixed(2)}`);
      lines.push(`Summary,Net Result,${this.netProfit().toFixed(2)}`);
      return lines.join('\n');
    }

    const lines = ['Section,Ledger,Amount'];
    this.assetRows().forEach(row => {
      lines.push(`Asset,${this.escapeCsv(row.ledger)},${row.net.toFixed(2)}`);
    });
    this.liabilityRows().forEach(row => {
      lines.push(`Liability,${this.escapeCsv(row.ledger)},${row.net.toFixed(2)}`);
    });
    lines.push(`Equity,Current Period Profit,${this.netProfit().toFixed(2)}`);
    lines.push(`Summary,Total Assets,${this.totalAssets().toFixed(2)}`);
    lines.push(`Summary,Total Liabilities + Equity,${this.totalLiabilitiesAndEquity().toFixed(2)}`);
    return lines.join('\n');
  }

  private getReportTitle(tab: ReportTab): string {
    if (tab === 'trial-balance') {
      return 'TRIAL BALANCE';
    }

    if (tab === 'profit-loss') {
      return 'PROFIT & LOSS STATEMENT';
    }

    return 'BALANCE SHEET';
  }

  private escapeCsv(value: string): string {
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
}
