import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccessLegacyService } from '../services/access-legacy.service';
import { AccessControlService } from '../services/access-control.service';

@Component({
  selector: 'app-legacy-rebuild',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="header">
        <h2>Access Rebuild Dashboard</h2>
        <p>Source: {{ legacyService.legacyMap$()?.sourceDatabase || 'Not loaded' }}</p>
      </div>

      <div class="role-box">
        <label>Current Role</label>
        <select [value]="accessControl.role$()" (change)="changeRole($event)">
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="operator">Operator</option>
        </select>
      </div>

      <div class="stats-grid" *ngIf="legacyService.legacyMap$() as legacy">
        <div class="stat-card"><h4>Tables</h4><p>{{ legacy.counts.tables }}</p></div>
        <div class="stat-card"><h4>Queries</h4><p>{{ legacy.counts.queries }}</p></div>
        <div class="stat-card"><h4>Forms</h4><p>{{ legacy.counts.forms }}</p></div>
        <div class="stat-card"><h4>Reports</h4><p>{{ legacy.counts.reports }}</p></div>
        <div class="stat-card"><h4>Modules</h4><p>{{ legacy.counts.modules }}</p></div>
      </div>

      <div class="section">
        <h3>Domain-wise Migration Plan</h3>
        <table *ngIf="legacyService.getDomains().length > 0">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Status</th>
              <th>Access</th>
              <th>Mapped Source Objects</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let domain of legacyService.getDomains()">
              <td>{{ domain.name }}</td>
              <td>{{ domain.status | uppercase }}</td>
              <td>{{ hasAccessForDomain(domain.name) ? 'Allowed' : 'Restricted' }}</td>
              <td>{{ domain.sourceObjects.length }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section" *ngIf="legacyService.legacyMap$() as legacy">
        <h3>Access Forms Included</h3>
        <div class="chip-list">
          <span class="chip" *ngFor="let form of legacy.formNames">{{ form }}</span>
        </div>
      </div>

      <div class="section" *ngIf="legacyService.legacyMap$() as legacy">
        <h3>Reports Included</h3>
        <div class="chip-list">
          <span class="chip" *ngFor="let report of legacy.reportNames">{{ report }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .container {
        max-width: 1300px;
        margin: 0 auto;
        padding: 20px;
      }

      .header {
        margin-bottom: 20px;
      }

      .header h2 {
        margin: 0;
      }

      .header p {
        margin-top: 8px;
        color: #666;
      }

      .role-box {
        margin-bottom: 20px;
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .role-box select {
        padding: 8px;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
        gap: 15px;
        margin-bottom: 25px;
      }

      .stat-card {
        background: #f4f6ff;
        border: 1px solid #d9e0ff;
        border-radius: 8px;
        padding: 14px;
      }

      .stat-card h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
      }

      .stat-card p {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
      }

      .section {
        background: #fff;
        border: 1px solid #e6e6e6;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
      }

      .section h3 {
        margin-top: 0;
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
        background: #f5f5f5;
      }

      .chip-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .chip {
        background: #eef5ff;
        border: 1px solid #d8e8ff;
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 12px;
      }
    `
  ]
})
export class LegacyRebuildComponent implements OnInit {
  constructor(
    public legacyService: AccessLegacyService,
    public accessControl: AccessControlService
  ) {}

  ngOnInit(): void {
    this.legacyService.load();
  }

  changeRole(event: Event): void {
    const role = (event.target as HTMLSelectElement).value as 'admin' | 'manager' | 'operator';
    this.accessControl.setRole(role);
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
}
