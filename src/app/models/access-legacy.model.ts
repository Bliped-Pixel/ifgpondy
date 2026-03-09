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

export interface AccessTableField {
  name: string;
  type: number;
  size: number;
  required: boolean;
  allowZeroLength: boolean;
}

export interface AccessTableDefinition {
  table: string;
  fields: AccessTableField[];
}

export interface AccessObjectName {
  name: string;
}

export interface AccessSummary {
  database: string;
  extractedAt: string;
  tableCount: number;
  queryCount: number;
  formCount: number;
  reportCount: number;
  macroCount: number;
  moduleCount: number;
  tables: AccessTableDefinition[];
  queries: AccessObjectName[];
  forms: AccessObjectName[];
  reports: AccessObjectName[];
  modules: AccessObjectName[];
}

export interface AccessCommandAction {
  id: string;
  label: string;
  legacyForm: string;
  route?: string;
  description: string;
}
