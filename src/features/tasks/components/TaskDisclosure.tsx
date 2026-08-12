import type { TaskRow } from '../../../lib/db';
import { updateTask } from '../api';
import { useActiveAreas } from '../../areas/api';

export default function TaskDisclosure({ task }: { task: TaskRow }) {
  const areas = useActiveAreas();

  return (
    <div className="flex flex-col gap-2 border-t border-neutral-100 px-1 pb-3 pt-2 text-sm dark:border-neutral-900">
      <textarea
        value={task.notes ?? ''}
        onChange={(e) => updateTask(task, { notes: e.target.value || null })}
        placeholder="Notes"
        rows={2}
        className="w-full resize-none border border-neutral-300 bg-transparent p-2 text-sm outline-none focus:border-black dark:border-neutral-700 dark:focus:border-white"
      />
      <div className="flex flex-wrap gap-4 text-xs">
        <label className="flex items-center gap-2">
          <span className="text-neutral-500 dark:text-neutral-400">Priority</span>
          <select
            value={task.priority}
            onChange={(e) => updateTask(task, { priority: Number(e.target.value) })}
            className="border border-neutral-300 bg-transparent p-1 dark:border-neutral-700"
          >
            {[0, 1, 2, 3].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-neutral-500 dark:text-neutral-400">Due</span>
          <input
            type="date"
            value={task.due_date ?? ''}
            onChange={(e) => updateTask(task, { due_date: e.target.value || null })}
            className="border border-neutral-300 bg-transparent p-1 dark:border-neutral-700"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-neutral-500 dark:text-neutral-400">Area</span>
          <select
            value={task.area_id ?? ''}
            onChange={(e) => updateTask(task, { area_id: e.target.value || null })}
            className="border border-neutral-300 bg-transparent p-1 dark:border-neutral-700"
          >
            <option value="">None</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
