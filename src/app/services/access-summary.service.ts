import { Injectable, computed, signal } from '@angular/core';
import { AccessSummary } from '../models/access-legacy.model';

@Injectable({
  providedIn: 'root'
})
export class AccessSummaryService {
  private summary = signal<AccessSummary | null>(null);
  private loading = signal(false);

  readonly summary$ = this.summary.asReadonly();
  readonly loading$ = this.loading.asReadonly();

  readonly stats$ = computed(() => {
    const summary = this.summary();
    if (!summary) {
      return null;
    }

    return [
      { key: 'tables', label: 'Tables', value: summary.tableCount },
      { key: 'queries', label: 'Queries', value: summary.queryCount },
      { key: 'forms', label: 'Forms', value: summary.formCount },
      { key: 'reports', label: 'Reports', value: summary.reportCount },
      { key: 'modules', label: 'Modules', value: summary.moduleCount }
    ];
  });

  async load(): Promise<void> {
    if (this.summary() || this.loading()) {
      return;
    }

    this.loading.set(true);

    try {
      const response = await fetch('/access-summary.json');
      if (!response.ok) {
        throw new Error(`Unable to load access summary: ${response.status}`);
      }

      this.summary.set((await response.json()) as AccessSummary);
    } catch (error) {
      console.error(error);
      this.summary.set(null);
    } finally {
      this.loading.set(false);
    }
  }
}
