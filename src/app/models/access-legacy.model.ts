export interface AccessLegacyCounts {
  tables: number;
  queries: number;
  forms: number;
  reports: number;
  modules: number;
}

export interface AccessLegacyMap {
  sourceDatabase: string;
  extractedAt: string;
  counts: AccessLegacyCounts;
  tableNames: string[];
  formNames: string[];
  reportNames: string[];
  moduleNames: string[];
}

export interface MigrationDomain {
  name: string;
  sourceObjects: string[];
  status: 'planned' | 'in-progress' | 'completed';
}
