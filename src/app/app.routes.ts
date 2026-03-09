import { Routes } from '@angular/router';
import { InventoryComponent } from './components/inventory/inventory.component';
import { BillingComponent } from './components/billing/billing.component';
import { CatalogComponent } from './components/catalog/catalog.component';
import { HomeComponent } from './components/home.component';
import { LegacyRebuildComponent } from './components/legacy-rebuild.component';
import { SalesComponent } from './components/sales/sales.component';
import { PurchaseComponent } from './components/purchase/purchase.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'inventory', component: InventoryComponent },
  { path: 'billing', component: BillingComponent },
  { path: 'sales', component: SalesComponent },
  { path: 'purchase', component: PurchaseComponent },
  { path: 'catalog', component: CatalogComponent },
  { path: 'legacy-rebuild', component: LegacyRebuildComponent },
  { path: '**', redirectTo: '' }
];
