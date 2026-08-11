import Dexie, { type Table } from 'dexie';
import type { OutboxRow } from './sync/types';

export type AreaRow = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted: boolean;
  name: string;
  color: string | null;
};

export type TaskRow = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted: boolean;
  title: string;
  notes: string | null;
  status: 'later' | 'now' | 'done';
  priority: number;
  due_date: string | null;
  completed_at: string | null;
  area_id: string | null;
};

export type HabitRow = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted: boolean;
  name: string;
  area_id: string | null;
  target_days: number[] | null;
  active: boolean;
};

export type HabitLogRow = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted: boolean;
  habit_id: string;
  log_date: string;
  done: boolean;
};

export type MetaRow = { key: string; value: string };

class OneLifeDB extends Dexie {
  area!: Table<AreaRow, string>;
  task!: Table<TaskRow, string>;
  habit!: Table<HabitRow, string>;
  habit_log!: Table<HabitLogRow, string>;
  outbox!: Table<OutboxRow, number>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super('onelife');
    this.version(1).stores({
      area: 'id, deleted, updated_at',
      task: 'id, deleted, status, due_date, updated_at',
      habit: 'id, deleted, active, updated_at',
      habit_log: 'id, [habit_id+log_date], deleted, updated_at',
      outbox: '++id, [table_name+row_id], created_at',
      meta: 'key',
    });
  }
}

export const db = new OneLifeDB();
