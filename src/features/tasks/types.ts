import type { TaskRow } from '../../lib/db';

export type TaskStatusFilter = 'all' | TaskRow['status'];
export type TaskAreaFilter = 'all' | string;
