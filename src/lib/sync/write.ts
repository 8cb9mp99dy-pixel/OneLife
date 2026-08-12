import { db } from '../db';
import { enqueueWrite } from './outbox';
import { flushOnce } from './flush';
import type { OutboxOperation, SyncedTableName } from './types';

// The one place "optimistic local write -> outbox row -> flush" (see
// CLAUDE.md rule 4) is implemented, so every feature's api.ts shares it
// instead of each re-implementing the sequence and risking drift.
export async function writeRow<T extends { id: string }>(
  table: SyncedTableName,
  row: T,
  operation: OutboxOperation,
): Promise<void> {
  await db.table(table).put(row);
  await enqueueWrite({ table_name: table, row_id: row.id, operation, payload: row });
  void flushOnce();
}
