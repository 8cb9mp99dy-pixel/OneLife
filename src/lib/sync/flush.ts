import { supabase } from '../supabase';
import { db } from '../db';
import { nextBackoffDelay } from './backoff';
import type { OutboxRow } from './types';

let flushing = false;
let backoffTimer: ReturnType<typeof setTimeout> | null = null;

export async function flushOnce(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    const rows = await db.outbox.orderBy('created_at').toArray();
    for (const row of rows) {
      await flushRow(row);
    }
  } finally {
    flushing = false;
  }
}

async function flushRow(row: OutboxRow): Promise<void> {
  try {
    if (row.operation === 'delete') {
      // Soft delete only — never a real DELETE.
      const { error } = await supabase
        .from(row.table_name)
        .update({ deleted: true })
        .eq('id', row.row_id);
      if (error) throw error;
    } else {
      // updated_at is never set by the client — the server trigger owns it.
      const { updated_at: _ignored, ...payload } = row.payload as { updated_at?: string };
      const { data, error } = await supabase
        .from(row.table_name)
        .upsert({ ...payload, id: row.row_id })
        .select()
        .single();
      if (error) throw error;
      if (data) await db.table(row.table_name).put(data);
    }

    if (row.id != null) await db.outbox.delete(row.id);
    clearScheduledRetry();
  } catch (err) {
    const attempts = row.attempts + 1;
    if (row.id != null) {
      await db.outbox.update(row.id, {
        attempts,
        last_error: err instanceof Error ? err.message : String(err),
      });
    }
    scheduleRetry(attempts);
  }
}

function scheduleRetry(attempts: number): void {
  if (backoffTimer) clearTimeout(backoffTimer);
  backoffTimer = setTimeout(() => void flushOnce(), nextBackoffDelay(attempts));
}

function clearScheduledRetry(): void {
  if (backoffTimer) {
    clearTimeout(backoffTimer);
    backoffTimer = null;
  }
}

// Wires the flush triggers: online event, focus/visibility change, app
// start, and a 60s interval fallback. Backoff (see nextBackoffDelay)
// handles repeated failures instead of hammering every 60s.
export function startFlushTriggers(): () => void {
  void flushOnce();

  const trigger = () => void flushOnce();
  window.addEventListener('online', trigger);
  window.addEventListener('focus', trigger);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') trigger();
  });
  const interval = setInterval(trigger, 60_000);

  return () => {
    window.removeEventListener('online', trigger);
    window.removeEventListener('focus', trigger);
    clearInterval(interval);
    clearScheduledRetry();
  };
}
