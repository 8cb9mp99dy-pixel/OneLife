import type { HabitRow } from '../../../lib/db';
import HabitItem from './HabitItem';

export default function HabitList({ habits }: { habits: HabitRow[] }) {
  if (habits.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">No habits yet.</p>;
  }

  return (
    <ul>
      {habits.map((h) => (
        <HabitItem key={h.id} habit={h} />
      ))}
    </ul>
  );
}
