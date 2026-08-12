import {
  IN_N_DAYS_PATTERN,
  TOMORROW_PATTERN,
  TONIGHT_PATTERN,
  WEEKDAY_PATTERN,
  WEEKDAYS,
} from './keywords';

export type ParsedDate = {
  due_date: string | null;
  matchedToken: string | null;
  title: string;
};

function toISODate(d: Date): string {
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

// Strictly after today, even if today already is that weekday — a bare
// weekday name always means the *next* one (see CLAUDE.md / §10).
function nextWeekdayStrictlyAfter(referenceDate: Date, targetDay: number): Date {
  let diff = (targetDay - referenceDate.getDay() + 7) % 7;
  if (diff === 0) diff = 7;
  return addDays(referenceDate, diff);
}

function stripToken(title: string, match: RegExpMatchArray): string {
  const start = match.index ?? 0;
  const end = start + match[0].length;
  return (title.slice(0, start) + title.slice(end)).replace(/\s{2,}/g, ' ').trim();
}

// Parses at most one date keyword out of the title (FR/EN). Any
// time-of-day text (e.g. "8am", "14h") is intentionally left alone — v1
// has no due-time field, and silently dropping it would lose information.
export function parseDate(title: string, referenceDate: Date): ParsedDate {
  const inDaysMatch = title.match(IN_N_DAYS_PATTERN);
  if (inDaysMatch) {
    const n = Number(inDaysMatch[1] ?? inDaysMatch[2]);
    return {
      due_date: toISODate(addDays(referenceDate, n)),
      matchedToken: inDaysMatch[0],
      title: stripToken(title, inDaysMatch),
    };
  }

  const tonightMatch = title.match(TONIGHT_PATTERN);
  if (tonightMatch) {
    return {
      due_date: toISODate(referenceDate),
      matchedToken: tonightMatch[0],
      title: stripToken(title, tonightMatch),
    };
  }

  const tomorrowMatch = title.match(TOMORROW_PATTERN);
  if (tomorrowMatch) {
    return {
      due_date: toISODate(addDays(referenceDate, 1)),
      matchedToken: tomorrowMatch[0],
      title: stripToken(title, tomorrowMatch),
    };
  }

  const weekdayMatch = title.match(WEEKDAY_PATTERN);
  if (weekdayMatch) {
    const targetDay = WEEKDAYS[weekdayMatch[0].toLowerCase()];
    return {
      due_date: toISODate(nextWeekdayStrictlyAfter(referenceDate, targetDay)),
      matchedToken: weekdayMatch[0],
      title: stripToken(title, weekdayMatch),
    };
  }

  return { due_date: null, matchedToken: null, title: title.trim() };
}
