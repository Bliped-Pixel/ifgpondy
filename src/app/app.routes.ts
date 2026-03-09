import { Routes } from '@angular/router';
import { InventoryComponent } from './components/inventory/inventory.component';
import { BillingComponent } from './components/billing/billing.component';
import { CatalogComponent } from './components/catalog/catalog.component';
import { HomeComponent } from './components/home.component';
import { LegacyRebuildComponent } from './components/legacy-rebuild.component';
import { SalesComponent } from './components/sales/sales.component';
import { PurchaseComponent } from './components/purchase/purchase.component';
import { AccountingVouchersComponent } from './components/accounting-vouchers.component';
import { AccountingDaybookComponent } from './components/accounting-daybook.component';
import { AccountingReportsComponent } from './components/accounting-reports.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'inventory', component: InventoryComponent },
  { path: 'billing', component: BillingComponent },
  { path: 'sales', component: SalesComponent },
  { path: 'purchase', component: PurchaseComponent },
  { path: 'vouchers', component: AccountingVouchersComponent },
  { path: 'accounts', component: AccountingDaybookComponent },
  { path: 'accounts-reports', component: AccountingReportsComponent },
  { path: 'catalog', component: CatalogComponent },
  { path: 'legacy-rebuild', component: LegacyRebuildComponent },
  { path: '**', redirectTo: '' }
];
