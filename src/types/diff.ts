export interface DiffSummary {
  totalSource: number;
  totalTarget: number;
  matched: number;
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
}

export interface FieldChange {
  path: string;
  oldValue: unknown;
  newValue: unknown;
  type: 'changed' | 'added' | 'removed';
}

export interface ModifiedItem {
  keyValue: string | number;
  sourceObject: Record<string, unknown>;
  targetObject: Record<string, unknown>;
  changes: FieldChange[];
}

export interface DiffResult {
  summary: DiffSummary;
  matchKey: string;
  added: Record<string, unknown>[];
  removed: Record<string, unknown>[];
  modified: ModifiedItem[];
  unchanged: Record<string, unknown>[];
}

export type DiffItemType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface DiffItem {
  type: DiffItemType;
  keyValue: string | number;
  data: Record<string, unknown>;
  targetData?: Record<string, unknown>;
  changes?: FieldChange[];
}
