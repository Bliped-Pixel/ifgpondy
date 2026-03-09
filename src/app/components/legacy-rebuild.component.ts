import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AccessLegacyService } from '../services/access-legacy.service';
import { AccessControlService, UserRole } from '../services/access-control.service';
import { AccessSummaryService } from '../services/access-summary.service';
import { AccessCommandAction } from '../models/access-legacy.model';

@Component({
  selector: 'app-legacy-rebuild',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="workbench">
      <header class="header">
        <div>
          <h1>Access Rebuild Workbench</h1>
          @if (legacyService.legacyMap$(); as legacyMap) {
            <p>Legacy source: {{ legacyMap.sourceDatabase }}</p>
          } @else {
            <p>Legacy map not loaded yet.</p>
          }
        </div>

        <div class="role-box">
          <label for="role-select">Role Profile</label>
          <select id="role-select" [value]="accessControl.role$()" (change)="changeRole($event)">
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="operator">Operator</option>
          </select>
        </div>
      </header>

      @if (summaryService.stats$(); as stats) {
        <section class="stats-grid" aria-label="Legacy object counts">
          @for (item of stats; track item.key) {
            <article class="stat-card">
              <h2>{{ item.label }}</h2>
              <p>{{ item.value }}</p>
            </article>
          }
        </section>
      }

      <section class="section">
        <h2>Command Center</h2>
        <p class="section-intro">Launch primary Access workflows and quickly see which actions are available for the selected role.</p>

        <div class="action-grid">
          @for (action of commandActions; track action.id) {
            <article class="action-card" [class.allowed]="accessControl.hasButtonAccess(action.legacyForm)">
              <h3>{{ action.label }}</h3>
              <p>{{ action.description }}</p>
              <p class="meta">Legacy form: <code>{{ action.legacyForm }}</code></p>

              @if (accessControl.hasButtonAccess(action.legacyForm)) {
                @if (action.route) {
                  <a [routerLink]="action.route" class="action-link">Open in Angular</a>
                } @else {
                  <span class="tag">Mapped next</span>
                }
              } @else {
                <span class="tag denied">Restricted</span>
              }
            </article>
          }
        </div>
      </section>

      <section class="section">
        <h2>Migration Domains</h2>
        <table>
          <thead>
            <tr>
              <th>Domain</th>
              <th>Status</th>
              <th>Role Access</th>
              <th>Mapped Source Objects</th>
            </tr>
          </thead>
          <tbody>
            @for (domain of legacyService.getDomains(); track domain.name) {
            <tr>
              <td>{{ domain.name }}</td>
              <td>{{ domain.status.toUpperCase() }}</td>
              <td>{{ hasAccessForDomain(domain.name) ? 'Allowed' : 'Restricted' }}</td>
              <td>{{ domain.sourceObjects.length }}</td>
            </tr>
            }
          </tbody>
        </table>
      </section>

      <section class="section">
        <h2>Legacy Object Explorer</h2>
        <div class="search-row">
          <label for="legacy-search">Filter objects</label>
          <input
            id="legacy-search"
            type="search"
            [value]="searchTerm()"
            (input)="setSearch($event)"
            placeholder="type table/form/query/report name"
          />
        </div>

        @if (summaryService.summary$(); as summary) {
          <div class="explorer-grid">
            <article>
              <h3>Forms ({{ filteredForms().length }})</h3>
              <div class="chip-list">
                @for (name of filteredForms(); track name) {
                  <span class="chip">{{ name }}</span>
                }
              </div>
            </article>

            <article>
              <h3>Reports ({{ filteredReports().length }})</h3>
              <div class="chip-list">
                @for (name of filteredReports(); track name) {
                  <span class="chip">{{ name }}</span>
                }
              </div>
            </article>

            <article>
              <h3>Queries ({{ filteredQueries().length }})</h3>
              <div class="chip-list">
                @for (name of filteredQueries(); track name) {
                  <span class="chip">{{ name }}</span>
                }
              </div>
            </article>

            <article>
              <h3>Tables ({{ filteredTables().length }})</h3>
              <div class="chip-list">
                @for (name of filteredTables(); track name) {
                  <span class="chip">{{ name }}</span>
                }
              </div>
            </article>
          </div>
          <p class="meta">Database path: <code>{{ summary.database }}</code></p>
        } @else {
          <p>Loading Access summary from extracted metadata...</p>
        }
      </section>

      <section class="section">
        <h2>Next Delivery Targets</h2>
        <ul class="targets">
          @for (target of nextTargets; track target) {
            <li>{{ target }}</li>
          }
        </ul>
      </section>
    </div>
  `,
  styles: [
    `
      .workbench {
        max-width: 1320px;
        margin: 0 auto;
        padding: 20px;
      }

      .header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: end;
        padding: 16px;
        border-radius: 12px;
        background: linear-gradient(120deg, #fef1e7, #fff9db);
        border: 1px solid #f5d9bc;
        margin-bottom: 18px;
      }

      h1 {
        margin: 0 0 6px 0;
        font-size: 30px;
      }

      h2 {
        margin: 0 0 8px 0;
      }

      .header p {
        margin: 0;
      }

      .role-box {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .role-box select,
      .search-row input {
        min-width: 200px;
        border-radius: 10px;
        border: 1px solid #d5d5d5;
        padding: 10px;
        font: inherit;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }

      .stat-card {
        background: #f3f8ff;
        border: 1px solid #cfdef2;
        border-radius: 10px;
        padding: 12px;
      }

      .stat-card h2 {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .stat-card p {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
      }

      .section {
        background: #ffffff;
        border: 1px solid #ececec;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 14px;
      }

      .section-intro {
        margin-top: 0;
      }

      .action-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
      }

      .action-card {
        border: 1px solid #ebebeb;
        border-radius: 10px;
        padding: 12px;
        background: #fafafa;
      }

      .action-card.allowed {
        border-color: #a8d7a8;
        background: #f5fff5;
      }

      .action-card h3 {
        margin: 0 0 6px 0;
      }

      .action-card p {
        margin: 0 0 8px 0;
      }

      .action-link {
        color: #0b5f36;
        font-weight: 600;
      }

      .tag {
        display: inline-block;
        border-radius: 999px;
        background: #fff1cc;
        color: #7c4a00;
        padding: 4px 10px;
        font-size: 12px;
      }

      .tag.denied {
        background: #ffe1e1;
        color: #8a0000;
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

      .search-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        margin-bottom: 12px;
      }

      .explorer-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 10px;
      }

      .chip-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .chip {
        border-radius: 999px;
        padding: 4px 10px;
        border: 1px solid #d8def1;
        background: #eef2ff;
        font-size: 12px;
      }

      .meta {
        font-size: 12px;
        color: #575757;
      }

      .targets {
        margin: 0;
        padding-left: 18px;
      }

      .targets li {
        margin-bottom: 6px;
      }

      @media (max-width: 900px) {
        .header {
          flex-direction: column;
          align-items: start;
        }
      }
    `
  ]
})
export class LegacyRebuildComponent {
  readonly legacyService = inject(AccessLegacyService);
  readonly accessControl = inject(AccessControlService);
  readonly summaryService = inject(AccessSummaryService);

  readonly searchTerm = signal('');

  readonly commandActions: AccessCommandAction[] = [
    {
      id: 'sales',
      label: 'Sales Entry',
      legacyForm: 'sales_form',
      route: '/sales',
      description: 'Daily sales with line items, tax and stock deduction.'
    },
    {
      id: 'purchase',
      label: 'Purchase Entry',
      legacyForm: 'purchase_form',
      route: '/purchase',
      description: 'Capture purchase bills and restock inventory.'
    },
    {
      id: 'stock',
      label: 'Stock Entry',
      legacyForm: 'stock_entry_form',
      route: '/inventory',
      description: 'Manage incoming stock and size-based quantities.'
    },
    {
      id: 'quotation',
      label: 'Quotation',
      legacyForm: 'quotation_form',
      description: 'Mapped from Access quotation workflow to Angular billing.'
    },
    {
      id: 'order',
      label: 'Order Form',
      legacyForm: 'order_form',
      description: 'Order pipeline that feeds sales and dispatch.'
    },
    {
      id: 'billing-list',
      label: 'Sales Bill List',
      legacyForm: 'sales_bill_list',
      route: '/billing',
      description: 'Browse generated sales bills and payment status.'
    },
    {
      id: 'receipt',
      label: 'Receipt Voucher',
      legacyForm: 'receipt_form',
      route: '/vouchers',
      description: 'Create customer receipts and post to ledger.'
    },
    {
      id: 'payment',
      label: 'Payment Voucher',
      legacyForm: 'payment_form',
      route: '/vouchers',
      description: 'Create supplier and expense payments with mode tracking.'
    },
    {
      id: 'day-book',
      label: 'Day Book',
      legacyForm: 'day_book',
      route: '/accounts',
      description: 'Daily debit/credit journal view across all postings.'
    },
    {
      id: 'ledger',
      label: 'Ledger Form',
      legacyForm: 'ledgerform',
      route: '/accounts',
      description: 'Ledger-wise balances and entry drilldown for accounts.'
    },
    {
      id: 'purchase-list',
      label: 'Purchase Bill List',
      legacyForm: 'purchase_bill_list',
      route: '/purchase',
      description: 'Track vendor bills and due balances.'
    },
    {
      id: 'reports',
      label: 'Monthly Sales Report',
      legacyForm: 'monthly_sales_report',
      description: 'Reporting pipeline under migration from Access.'
    },
    {
      id: 'trial-balance',
      label: 'Trial Balance',
      legacyForm: 'trial_balance_form',
      route: '/accounts-reports',
      description: 'Ledger trial balance with debit and credit totals.'
    },
    {
      id: 'profit-loss',
      label: 'Profit & Loss',
      legacyForm: 'profit_loss_form',
      route: '/accounts-reports',
      description: 'Income vs expense summary for current posting data.'
    },
    {
      id: 'balance-sheet',
      label: 'Balance Sheet',
      legacyForm: 'balance_sheet',
      route: '/accounts-reports',
      description: 'Assets and liabilities view derived from ledger balances.'
    }
  ];

  readonly nextTargets = [
    'Recreate day_book + ledger_form workflows with filterable transaction journal.',
    'Migrate receipt_form and payment_form with voucher numbering and ledger posting.',
    'Port trial_balance_form, profit_loss_form and balance_sheet calculations.',
    'Add side-by-side validation against Access report outputs for final parity.'
  ];

  readonly filteredForms = computed(() => this.filterNames(this.summaryService.summary$()?.forms.map(item => item.name) ?? []));
  readonly filteredReports = computed(() =>
    this.filterNames(this.summaryService.summary$()?.reports.map(item => item.name) ?? [])
  );
  readonly filteredQueries = computed(() =>
    this.filterNames(this.summaryService.summary$()?.queries.map(item => item.name) ?? [])
  );
  readonly filteredTables = computed(() =>
    this.filterNames(this.summaryService.summary$()?.tables.map(item => item.table) ?? [])
  );

  constructor() {
    void this.legacyService.load();
    void this.summaryService.load();
  }

  changeRole(event: Event): void {
    const role = (event.target as HTMLSelectElement).value as UserRole;
    this.accessControl.setRole(role);
  }

  setSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value.trim().toLowerCase());
  }

  hasAccessForDomain(domainName: string): boolean {
    const key =
      domainName === 'Inventory & Items'
        ? 'inventory'
        : domainName === 'Sales & Billing'
          ? 'billing'
          : domainName === 'Purchase & Vendors'
            ? 'billing'
            : domainName === 'Accounting & Ledger'
              ? 'legacy-rebuild'
              : 'legacy-rebuild';

    return this.accessControl.hasAccess(key);
  }

  private filterNames(names: string[]): string[] {
    const searchTerm = this.searchTerm();
    if (!searchTerm) {
      return names;
    }

    return names.filter(name => name.toLowerCase().includes(searchTerm));
  }
}
