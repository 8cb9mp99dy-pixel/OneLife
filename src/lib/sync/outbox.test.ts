import { describe, expect, it } from 'vitest';
import { mergeOutboxWrite } from './outbox';
import type { OutboxRow } from './types';

const NOW = '2026-08-11T12:00:00.000Z';

describe('mergeOutboxWrite', () => {
  it('creates a fresh pending row when nothing is queued for this row yet', () => {
    const result = mergeOutboxWrite(undefined, {
      table_name: 'task',
      row_id: 'task-1',
      operation: 'insert',
      payload: { title: 'Buy milk' },
    }, NOW);

    expect(result).toEqual({
      table_name: 'task',
      row_id: 'task-1',
      operation: 'insert',
      payload: { title: 'Buy milk' },
      created_at: NOW,
      attempts: 0,
      last_error: null,
    });
  });

  it('replaces the payload rather than appending, coalescing repeated edits into one write', () => {
    const existing: OutboxRow = {
      id: 1,
      table_name: 'task',
      row_id: 'task-1',
      operation: 'update',
      payload: { title: 'Buy milk' },
      created_at: NOW,
      attempts: 0,
      last_error: null,
    };

    const afterSecondEdit = mergeOutboxWrite(existing, {
      table_name: 'task',
      row_id: 'task-1',
      operation: 'update',
      payload: { title: 'Buy oat milk' },
    }, NOW);

    const afterThirdEdit = mergeOutboxWrite(afterSecondEdit, {
      table_name: 'task',
      row_id: 'task-1',
      operation: 'update',
      payload: { title: 'Buy oat milk and eggs' },
    }, NOW);

    expect(afterThirdEdit.payload).toEqual({ title: 'Buy oat milk and eggs' });
  });

  it('keeps operation "insert" if further edits arrive before the insert has synced', () => {
    const existing: OutboxRow = {
      id: 1,
      table_name: 'task',
      row_id: 'task-1',
      operation: 'insert',
      payload: { title: 'Buy milk' },
      created_at: NOW,
      attempts: 0,
      last_error: null,
    };

    const result = mergeOutboxWrite(existing, {
      table_name: 'task',
      row_id: 'task-1',
      operation: 'update',
      payload: { title: 'Buy oat milk' },
    }, NOW);

    expect(result.operation).toBe('insert');
  });

  it('lets a delete win outright over any pending insert/update', () => {
    const existing: OutboxRow = {
      id: 1,
      table_name: 'task',
      row_id: 'task-1',
      operation: 'update',
      payload: { title: 'Buy oat milk' },
      created_at: NOW,
      attempts: 0,
      last_error: null,
    };

    const result = mergeOutboxWrite(existing, {
      table_name: 'task',
      row_id: 'task-1',
      operation: 'delete',
      payload: { deleted: true },
    }, NOW);

    expect(result.operation).toBe('delete');
    expect(result.payload).toEqual({ deleted: true });
  });

  it('resets attempts and last_error on a fresh local edit', () => {
    const existing: OutboxRow = {
      id: 1,
      table_name: 'task',
      row_id: 'task-1',
      operation: 'update',
      payload: { title: 'Buy oat milk' },
      created_at: NOW,
      attempts: 3,
      last_error: 'network error',
    };

    const result = mergeOutboxWrite(existing, {
      table_name: 'task',
      row_id: 'task-1',
      operation: 'update',
      payload: { title: 'Buy oat milk and eggs' },
    }, NOW);

    expect(result.attempts).toBe(0);
    expect(result.last_error).toBeNull();
  });
});
