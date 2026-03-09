import { Injectable, signal } from '@angular/core';

export type UserRole = 'admin' | 'manager' | 'operator';

interface EmployeeAccessRule {
  authId: UserRole;
  buttonName: string;
  hasAccess: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AccessControlService {
  private currentRole = signal<UserRole>('admin');

  role$ = this.currentRole.asReadonly();

  private permissions: Record<UserRole, string[]> = {
    admin: ['*'],
    manager: ['inventory', 'billing', 'catalog', 'legacy-rebuild'],
    operator: ['inventory', 'billing', 'catalog']
  };

  // Mirrors legacy `employeeaccess` table behavior for button-level gating.
  private employeeAccessRules: EmployeeAccessRule[] = [
    { authId: 'admin', buttonName: '*', hasAccess: true },

    { authId: 'manager', buttonName: 'dashboard', hasAccess: true },
    { authId: 'manager', buttonName: 'sales_form', hasAccess: true },
    { authId: 'manager', buttonName: 'purchase_form', hasAccess: true },
    { authId: 'manager', buttonName: 'quotation_form', hasAccess: true },
    { authId: 'manager', buttonName: 'order_form', hasAccess: true },
    { authId: 'manager', buttonName: 'stock_entry_form', hasAccess: true },
    { authId: 'manager', buttonName: 'item_selection_form', hasAccess: true },
    { authId: 'manager', buttonName: 'sales_bill_list', hasAccess: true },
    { authId: 'manager', buttonName: 'purchase_bill_list', hasAccess: true },
    { authId: 'manager', buttonName: 'monthly_sales_report', hasAccess: true },
    { authId: 'manager', buttonName: 'receipt_form', hasAccess: true },
    { authId: 'manager', buttonName: 'payment_form', hasAccess: true },
    { authId: 'manager', buttonName: 'day_book', hasAccess: true },
    { authId: 'manager', buttonName: 'ledgerform', hasAccess: true },
    { authId: 'manager', buttonName: 'trial_balance_form', hasAccess: true },
    { authId: 'manager', buttonName: 'profit_loss_form', hasAccess: true },
    { authId: 'manager', buttonName: 'balance_sheet', hasAccess: true },
    { authId: 'manager', buttonName: 'employeeaccess', hasAccess: false },

    { authId: 'operator', buttonName: 'dashboard', hasAccess: true },
    { authId: 'operator', buttonName: 'sales_form', hasAccess: true },
    { authId: 'operator', buttonName: 'purchase_form', hasAccess: true },
    { authId: 'operator', buttonName: 'quotation_form', hasAccess: true },
    { authId: 'operator', buttonName: 'order_form', hasAccess: true },
    { authId: 'operator', buttonName: 'stock_entry_form', hasAccess: true },
    { authId: 'operator', buttonName: 'item_selection_form', hasAccess: true },
    { authId: 'operator', buttonName: 'sales_bill_list', hasAccess: true },
    { authId: 'operator', buttonName: 'purchase_bill_list', hasAccess: true },
    { authId: 'operator', buttonName: 'receipt_form', hasAccess: true },
    { authId: 'operator', buttonName: 'payment_form', hasAccess: true },
    { authId: 'operator', buttonName: 'day_book', hasAccess: true },
    { authId: 'operator', buttonName: 'ledgerform', hasAccess: false },
    { authId: 'operator', buttonName: 'monthly_sales_report', hasAccess: false },
    { authId: 'operator', buttonName: 'employeeaccess', hasAccess: false },
    { authId: 'operator', buttonName: 'balance_sheet', hasAccess: false },
    { authId: 'operator', buttonName: 'trial_balance_form', hasAccess: false },
    { authId: 'operator', buttonName: 'profit_loss_form', hasAccess: false }
  ];

  setRole(role: UserRole): void {
    this.currentRole.set(role);
  }

  hasAccess(feature: string): boolean {
    const allowed = this.permissions[this.currentRole()];
    return allowed.includes('*') || allowed.includes(feature);
  }

  hasButtonAccess(buttonName: string): boolean {
    const role = this.currentRole();

    if (role === 'admin') {
      return true;
    }

    const exactRule = this.employeeAccessRules.find(
      rule => rule.authId === role && rule.buttonName.toLowerCase() === buttonName.toLowerCase()
    );

    return exactRule ? exactRule.hasAccess : false;
  }
}
