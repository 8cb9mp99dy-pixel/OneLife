import type { HabitRow } from '../../../lib/db';
import { useHabitLogs, toggleHabitToday, deleteHabit } from '../api';
import { calculateStreak } from '../streak';
import WeekGrid from './WeekGrid';

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function HabitItem({ habit }: { habit: HabitRow }) {
  const logs = useHabitLogs(habit.id);
  const streak = calculateStreak(habit, logs, new Date());

  return (
    <li className="flex items-center justify-between gap-3 border-b border-neutral-200 py-3 dark:border-neutral-800">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{habit.name}</p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          {streak > 0 ? `${streak} day streak` : 'No streak yet'}
        </p>
      </div>
      <WeekGrid
        logs={logs}
        targetDays={habit.target_days}
        onToggleToday={() => toggleHabitToday(habit, toDateStr(new Date()))}
      />
      <button
        onClick={() => deleteHabit(habit)}
        className="shrink-0 text-xs text-neutral-400 transition-colors duration-150 hover:text-black dark:text-neutral-500 dark:hover:text-white"
      >
        Delete
      </button>
    </li>
  );
}
