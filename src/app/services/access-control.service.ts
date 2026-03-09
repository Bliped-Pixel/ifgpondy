import { Injectable, signal } from '@angular/core';

type UserRole = 'admin' | 'manager' | 'operator';

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

  setRole(role: UserRole): void {
    this.currentRole.set(role);
  }

  hasAccess(feature: string): boolean {
    const allowed = this.permissions[this.currentRole()];
    return allowed.includes('*') || allowed.includes(feature);
  }
}
