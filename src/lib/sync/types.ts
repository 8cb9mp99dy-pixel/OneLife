export const SYNCED_TABLES = ['area', 'task', 'habit', 'habit_log'] as const;
export type SyncedTableName = (typeof SYNCED_TABLES)[number];

export type OutboxOperation = 'insert' | 'update' | 'delete';

export type OutboxRow = {
  id?: number;
  table_name: string;
  row_id: string;
  operation: OutboxOperation;
  payload: Record<string, unknown>;
  created_at: string;
  attempts: number;
  last_error: string | null;
};

export type OutboxWrite = {
  table_name: string;
  row_id: string;
  operation: OutboxOperation;
  payload: Record<string, unknown>;
};
