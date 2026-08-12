import { useState } from 'react';
import type { TaskRow } from '../../../lib/db';
import { updateTask, deleteTask } from '../api';
import TaskDisclosure from './TaskDisclosure';
import Chip from '../../../components/Chip';

const STATUS_CYCLE: Record<TaskRow['status'], TaskRow['status']> = {
  later: 'now',
  now: 'done',
  done: 'later',
};

function formatDueDate(dueDate: string): string {
  // Parsed as local time (not UTC) so the displayed day always matches
  // the stored YYYY-MM-DD, regardless of the viewer's timezone offset.
  return new Date(`${dueDate}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default function TaskItem({ task }: { task: TaskRow }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-3 py-3">
        <button
          onClick={() => updateTask(task, { status: STATUS_CYCLE[task.status] })}
          className="shrink-0 border border-black px-2 py-1 text-xs uppercase tracking-wide dark:border-white"
        >
          {task.status}
        </button>
        <button
          onClick={() => setExpanded((v) => !v)}
          className={`flex-1 truncate text-left text-sm ${
            task.status === 'done' ? 'text-neutral-400 line-through dark:text-neutral-600' : ''
          }`}
        >
          {task.title}
        </button>
        {task.due_date && (
          <Chip onDismiss={() => updateTask(task, { due_date: null })}>{formatDueDate(task.due_date)}</Chip>
        )}
        <button
          onClick={() => deleteTask(task)}
          className="shrink-0 text-xs text-neutral-400 hover:text-black dark:text-neutral-500 dark:hover:text-white"
        >
          Delete
        </button>
      </div>
      {expanded && <TaskDisclosure task={task} />}
    </li>
  );
}
