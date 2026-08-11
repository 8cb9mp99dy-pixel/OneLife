import { db } from '../db';
import type { OutboxRow, OutboxWrite } from './types';

// Coalesces a new write against an existing pending outbox row for the
// same (table_name, row_id): replaces the payload/operation rather than
// appending, so N offline edits to the same row produce one network write.
export function mergeOutboxWrite(
  existing: OutboxRow | undefined,
  write: OutboxWrite,
  now: string,
): OutboxRow {
  if (!existing) {
    return { ...write, created_at: now, attempts: 0, last_error: null };
  }

  // A delete always wins outright — nothing to merge into it.
  if (write.operation === 'delete') {
    return { ...existing, operation: 'delete', payload: write.payload, attempts: 0, last_error: null };
  }

  return {
    ...existing,
    // insert stays insert even if followed by an update — the row hasn't
    // reached the server yet, so it's still a brand-new row there.
    operation: existing.operation === 'insert' ? 'insert' : write.operation,
    payload: { ...existing.payload, ...write.payload },
    attempts: 0,
    last_error: null,
  };
}

export async function enqueueWrite(write: OutboxWrite): Promise<void> {
  await db.transaction('rw', db.outbox, async () => {
    const existing = await db.outbox
      .where('[table_name+row_id]')
      .equals([write.table_name, write.row_id])
      .first();

    const merged = mergeOutboxWrite(existing, write, new Date().toISOString());

    if (existing?.id != null) {
      await db.outbox.update(existing.id, merged);
    } else {
      await db.outbox.add(merged);
    }
  });
}
