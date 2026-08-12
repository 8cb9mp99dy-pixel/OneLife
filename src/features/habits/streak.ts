import type { HabitLogRow, HabitRow } from '../../lib/db';

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function isScheduled(date: Date, targetDays: number[] | null): boolean {
  return targetDays === null || targetDays.includes(date.getDay());
}

// The current streak: consecutive *scheduled* days, ending today (or
// yesterday if today isn't logged yet — a grace period), for which
// habit_log.done = true. Non-scheduled days are skipped when walking
// backward and don't break the streak.
//
// A scheduled day with no log, or an explicit done=false, breaks the
// streak — except today specifically, where "not yet logged" gets the
// grace period instead of counting as a break. A soft-deleted log for
// today (see toggleHabitToday) counts as "not logged", not as false.
export function calculateStreak(
  habit: Pick<HabitRow, 'target_days'>,
  logs: Pick<HabitLogRow, 'log_date' | 'done' | 'deleted'>[],
  today: Date,
): number {
  const doneByDate = new Map<string, boolean>();
  for (const entry of logs) {
    if (!entry.deleted) doneByDate.set(entry.log_date, entry.done);
  }

  let cursor = today;
  if (!doneByDate.has(toDateStr(today))) {
    cursor = addDays(today, -1);
  }

  let streak = 0;
  // Bounded loop as a safety net against runaway iteration.
  for (let i = 0; i < 3650; i++) {
    if (isScheduled(cursor, habit.target_days)) {
      if (doneByDate.get(toDateStr(cursor)) === true) {
        streak++;
      } else {
        break;
      }
    }
    cursor = addDays(cursor, -1);
  }

  return streak;
}
