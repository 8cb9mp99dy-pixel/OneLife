import { useLiveQuery } from 'dexie-react-hooks';
import { db, type AreaRow } from '../../lib/db';
import { writeRow } from '../../lib/sync/write';

export async function createArea(name: string, userId: string): Promise<AreaRow> {
  const now = new Date().toISOString();
  const row: AreaRow = {
    id: crypto.randomUUID(),
    user_id: userId,
    created_at: now,
    updated_at: now,
    deleted: false,
    name,
    color: null,
  };
  await writeRow('area', row, 'insert');
  return row;
}

// Archived (soft-deleted) areas stay hidden from the picker for new items,
// but items already tagged with one keep showing it — see CLAUDE.md.
export function useActiveAreas(): AreaRow[] {
  return useLiveQuery(() => db.area.filter((a) => !a.deleted).toArray(), [], [] as AreaRow[]);
}
