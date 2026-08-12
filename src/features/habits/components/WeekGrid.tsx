import type { HabitLogRow } from '../../../lib/db';

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // index = Date.getDay()

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function WeekGrid({
  logs,
  targetDays,
  onToggleToday,
}: {
  logs: HabitLogRow[];
  targetDays: number[] | null;
  onToggleToday: () => void;
}) {
  const today = new Date();
  const todayStr = toDateStr(today);
  const doneByDate = new Map(logs.filter((l) => !l.deleted).map((l) => [l.log_date, l.done]));

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  return (
    <div className="flex gap-1">
      {days.map((d) => {
        const dateStr = toDateStr(d);
        const scheduled = targetDays === null || targetDays.includes(d.getDay());
        const done = doneByDate.get(dateStr) === true;
        const isToday = dateStr === todayStr;
        const base = 'flex h-8 w-8 shrink-0 items-center justify-center text-xs border';
        const style = !scheduled
          ? 'border-neutral-100 text-neutral-300 dark:border-neutral-900 dark:text-neutral-700'
          : done
            ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
            : 'border-neutral-300 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400';

        return isToday ? (
          <button key={dateStr} onClick={onToggleToday} className={`${base} ${style}`}>
            {DAY_INITIALS[d.getDay()]}
          </button>
        ) : (
          <div key={dateStr} className={`${base} ${style}`}>
            {DAY_INITIALS[d.getDay()]}
          </div>
        );
      })}
    </div>
  );
}
