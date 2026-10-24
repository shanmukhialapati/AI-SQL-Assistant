export interface ColumnInfo { name: string; type: string; nulls?: number }

export interface PreviewResponse {
  filename: string;
  sheets: string[];
  sheet: string;
  suggested_table: string;
  row_count: number;
  columns: ColumnInfo[];
  preview: Record<string, unknown>[];
  duplicate_rows: number;
}

export interface TableSummary { name: string; rows: number; columns: number }

export interface QueryResult {
  columns: string[];
  rows: unknown[][];
  row_count: number;
  truncated: boolean;
  elapsed_ms: number;
}

export interface HistoryItem { id: number; question: string | null; sql: string; created_at: string }
export interface SavedQuery { id: number; name: string; sql: string }
