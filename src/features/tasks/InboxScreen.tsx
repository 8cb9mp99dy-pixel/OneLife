import { useMemo, useState } from 'react';
import { useTasks } from './api';
import { useActiveAreas } from '../areas/api';
import TaskList from './components/TaskList';
import type { TaskStatusFilter, TaskAreaFilter } from './types';

const STATUS_FILTERS: TaskStatusFilter[] = ['all', 'later', 'now', 'done'];

export default function InboxScreen() {
  const tasks = useTasks();
  const areas = useActiveAreas();
  const [status, setStatus] = useState<TaskStatusFilter>('all');
  const [areaId, setAreaId] = useState<TaskAreaFilter>('all');

  const filtered = useMemo(
    () =>
      tasks
        .filter((t) => status === 'all' || t.status === status)
        .filter((t) => areaId === 'all' || t.area_id === areaId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [tasks, status, areaId],
  );

  return (
    <div className="mx-auto max-w-lg px-6 pb-40 pt-6">
      <h1 className="mb-4 text-lg font-medium">Inbox</h1>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-md border px-2 py-1 uppercase tracking-wide transition-colors duration-150 ${
              status === s
                ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                : 'border-neutral-300 hover:border-black dark:border-neutral-700 dark:hover:border-white'
            }`}
          >
            {s}
          </button>
        ))}
        <select
          value={areaId}
          onChange={(e) => setAreaId(e.target.value)}
          className="field w-auto px-2 py-1 text-xs"
        >
          <option value="all">All areas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <TaskList tasks={filtered} />
    </div>
  );
}
