import { useLiveQuery } from 'dexie-react-hooks';
import { db, type HabitRow, type HabitLogRow } from '../../lib/db';
import { writeRow } from '../../lib/sync/write';
import { newId } from '../../lib/id';

export type NewHabitInput = {
  name: string;
  area_id?: string | null;
  target_days?: number[] | null;
};

export async function createHabit(input: NewHabitInput, userId: string): Promise<HabitRow> {
  const now = new Date().toISOString();
  const row: HabitRow = {
    id: newId(),
    user_id: userId,
    created_at: now,
    updated_at: now,
    deleted: false,
    name: input.name,
    area_id: input.area_id ?? null,
    target_days: input.target_days ?? null,
    active: true,
  };
  await writeRow('habit', row, 'insert');
  return row;
}

export async function deleteHabit(habit: HabitRow): Promise<void> {
  const next: HabitRow = { ...habit, deleted: true, updated_at: new Date().toISOString() };
  await writeRow('habit', next, 'delete');
}

export function useActiveHabits(): HabitRow[] {
  return useLiveQuery(() => db.habit.filter((h) => !h.deleted && h.active).toArray(), [], [] as HabitRow[]);
}

export function useHabitLogs(habitId: string): HabitLogRow[] {
  return useLiveQuery(
    () => db.habit_log.where('[habit_id+log_date]').between([habitId, ''], [habitId, '￿']).toArray(),
    [habitId],
    [] as HabitLogRow[],
  );
}

// One tap, no confirmation dialog (see §10). Always reuses the existing
// row for (habit_id, log_date) rather than inserting a new one on
// re-toggle — the unique constraint on that pair means a second insert
// for the same day would fail, so "un-checking" soft-deletes the
// existing row instead of leaving a duplicate to resurrect later.
export async function toggleHabitToday(habit: HabitRow, today: string): Promise<void> {
  const existing = await db.habit_log
    .where('[habit_id+log_date]')
    .equals([habit.id, today])
    .first();

  const now = new Date().toISOString();

  if (!existing || existing.deleted) {
    const row: HabitLogRow = existing
      ? { ...existing, done: true, deleted: false, updated_at: now }
      : {
          id: newId(),
          user_id: habit.user_id,
          created_at: now,
          updated_at: now,
          deleted: false,
          habit_id: habit.id,
          log_date: today,
          done: true,
        };
    await writeRow('habit_log', row, existing ? 'update' : 'insert');
  } else {
    const row: HabitLogRow = { ...existing, deleted: true, updated_at: now };
    await writeRow('habit_log', row, 'delete');
  }
}
