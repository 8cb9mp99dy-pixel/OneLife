import { useLiveQuery } from 'dexie-react-hooks';
import { db, type TaskRow } from '../../lib/db';
import { writeRow } from '../../lib/sync/write';

export type NewTaskInput = {
  title: string;
  notes?: string | null;
  status?: TaskRow['status'];
  priority?: number;
  due_date?: string | null;
  area_id?: string | null;
};

// New captures land in the backlog ('later') by default — quick capture
// is about getting the thought down, not committing to doing it today.
// "Now" is an explicit choice made afterward (see CLAUDE.md / §10).
export async function createTask(input: NewTaskInput, userId: string): Promise<TaskRow> {
  const now = new Date().toISOString();
  const row: TaskRow = {
    id: crypto.randomUUID(),
    user_id: userId,
    created_at: now,
    updated_at: now,
    deleted: false,
    title: input.title,
    notes: input.notes ?? null,
    status: input.status ?? 'later',
    priority: input.priority ?? 0,
    due_date: input.due_date ?? null,
    completed_at: null,
    area_id: input.area_id ?? null,
  };
  await writeRow('task', row, 'insert');
  return row;
}

export async function updateTask(task: TaskRow, patch: Partial<TaskRow>): Promise<void> {
  const next: TaskRow = { ...task, ...patch, updated_at: new Date().toISOString() };
  // The server trigger (set_task_completed_at) owns this transition — this
  // mirrors it locally only so the UI updates before the round trip.
  if (patch.status === 'done' && task.status !== 'done') next.completed_at = next.updated_at;
  if (patch.status && patch.status !== 'done' && task.status === 'done') next.completed_at = null;
  await writeRow('task', next, 'update');
}

export async function deleteTask(task: TaskRow): Promise<void> {
  const next: TaskRow = { ...task, deleted: true, updated_at: new Date().toISOString() };
  await writeRow('task', next, 'delete');
}

export function useTasks(): TaskRow[] {
  return useLiveQuery(() => db.task.filter((t) => !t.deleted).toArray(), [], [] as TaskRow[]);
}
