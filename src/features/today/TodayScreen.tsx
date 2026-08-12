import { useMemo } from 'react';
import { useTasks } from '../tasks/api';
import TaskList from '../tasks/components/TaskList';
import { useActiveHabits } from '../habits/api';
import HabitList from '../habits/components/HabitList';

export default function TodayScreen() {
  const tasks = useTasks();
  const habits = useActiveHabits();

  // Oldest committed task first — this is a working list, not a triage
  // view (Inbox sorts newest-first for reviewing what just came in).
  const nowTasks = useMemo(
    () => tasks.filter((t) => t.status === 'now').sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [tasks],
  );

  const todaysHabits = useMemo(() => {
    const day = new Date().getDay();
    return habits.filter((h) => h.target_days === null || h.target_days.includes(day));
  }, [habits]);

  return (
    <div className="mx-auto max-w-lg px-6 pb-40 pt-6">
      <h1 className="mb-4 text-lg font-medium">Today</h1>
      <TaskList tasks={nowTasks} />

      <h2 className="mb-2 mt-8 text-sm font-medium text-neutral-500 dark:text-neutral-400">Habits</h2>
      <HabitList habits={todaysHabits} />
    </div>
  );
}
