import { supabase } from '../supabase';
import { db } from '../db';
import { SYNCED_TABLES, type SyncedTableName as SyncedTable } from './types';

const EPOCH = '1970-01-01T00:00:00.000Z';

async function getLastSync(table: SyncedTable): Promise<string> {
  const row = await db.meta.get(`last_sync:${table}`);
  return row?.value ?? EPOCH;
}

async function setLastSync(table: SyncedTable, value: string): Promise<void> {
  await db.meta.put({ key: `last_sync:${table}`, value });
}

// Pulls rows changed since the last successful pull for this table
// (including soft-deletes) and advances the watermark to the max
// updated_at actually returned — not the client clock — so nothing is
// missed if a write lands mid-request.
export async function pullTable(table: SyncedTable): Promise<void> {
  const since = await getLastSync(table);

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .gt('updated_at', since)
    .order('updated_at', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return;

  await db.transaction('rw', db[table], async () => {
    for (const row of data) {
      await db[table].put(row as never);
    }
  });

  const maxUpdatedAt = (data[data.length - 1] as { updated_at: string }).updated_at;
  await setLastSync(table, maxUpdatedAt);
}

export async function pullAll(): Promise<void> {
  for (const table of SYNCED_TABLES) {
    await pullTable(table);
  }
}
