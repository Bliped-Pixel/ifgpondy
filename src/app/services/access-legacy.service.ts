import { Injectable, signal } from '@angular/core';
import { AccessLegacyMap, MigrationDomain } from '../models/access-legacy.model';

@Injectable({
  providedIn: 'root'
})
export class AccessLegacyService {
  private legacyMap = signal<AccessLegacyMap | null>(null);
  private loading = signal(false);

  legacyMap$ = this.legacyMap.asReadonly();
  loading$ = this.loading.asReadonly();

  async load(): Promise<void> {
    if (this.legacyMap() || this.loading()) {
      return;
    }

    this.loading.set(true);

    try {
      const response = await fetch('/access-legacy-map.json');
      if (!response.ok) {
        throw new Error(`Unable to load access metadata: ${response.status}`);
      }

      const data = (await response.json()) as AccessLegacyMap;
      this.legacyMap.set(data);
    } catch (error) {
      console.error(error);
      this.legacyMap.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  getDomains(): MigrationDomain[] {
    const map = this.legacyMap();
    if (!map) {
      return [];
    }

    return [
      {
        name: 'Inventory & Items',
        sourceObjects: map.tableNames.filter(name =>
          ['item', 'stock', 'size', 'material', 'unit'].some(token => name.toLowerCase().includes(token))
        ),
        status: 'in-progress'
      },
      {
        name: 'Sales & Billing',
        sourceObjects: map.tableNames.filter(name =>
          ['sales', 'quotation', 'order', 'receipt'].some(token => name.toLowerCase().includes(token))
        ),
        status: 'in-progress'
      },
      {
        name: 'Purchase & Vendors',
        sourceObjects: map.tableNames.filter(name =>
          ['purchase', 'pur_'].some(token => name.toLowerCase().includes(token))
        ),
        status: 'planned'
      },
      {
        name: 'Accounting & Ledger',
        sourceObjects: map.tableNames.filter(name =>
          ['ledger', 'account', 'contra', 'payment'].some(token => name.toLowerCase().includes(token))
        ),
        status: 'planned'
      },
      {
        name: 'Users & Access Control',
        sourceObjects: map.tableNames.filter(name =>
          ['user', 'access', 'login', 'employee'].some(token => name.toLowerCase().includes(token))
        ),
        status: 'planned'
      }
    ];
  }
}
