import { useMemo } from 'react';
import { useTasks } from '../tasks/api';
import TaskList from '../tasks/components/TaskList';

export default function TodayScreen() {
  const tasks = useTasks();

  // Oldest committed task first — this is a working list, not a triage
  // view (Inbox sorts newest-first for reviewing what just came in).
  const nowTasks = useMemo(
    () => tasks.filter((t) => t.status === 'now').sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [tasks],
  );

  return (
    <div className="mx-auto max-w-lg px-4 pb-40 pt-6">
      <h1 className="mb-4 text-lg font-medium">Today</h1>
      <TaskList tasks={nowTasks} />
      {/* Today's habit check-ins land here in Phase 6 */}
    </div>
  );
}
