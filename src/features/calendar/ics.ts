import type { CalendarEvent } from './types';

// Minimal iCalendar parser + recurrence expansion for the Agenda window.
// Deliberately not a full RFC 5545 implementation — it covers what Apple
// Calendar's published feeds actually emit for personal calendars:
//   - timed, floating, UTC ("...Z") and all-day (VALUE=DATE) events
//   - RRULE FREQ=DAILY/WEEKLY (with BYDAY)/MONTHLY (same day-of-month or
//     BYMONTHDAY)/YEARLY, with INTERVAL, COUNT, UNTIL
//   - EXDATE cancellations and RECURRENCE-ID overrides
// Known approximations, on purpose: TZID times are treated as local wall
// time (a personal calendar is nearly always in the viewer's own zone),
// and MONTHLY BYDAY ordinals ("2nd Tuesday") fall back to DTSTART's
// day-of-month.

type RawEvent = {
  uid: string;
  summary: string;
  location: string | null;
  start: Date;
  end: Date | null;
  allDay: boolean;
  rrule: Map<string, string> | null;
  exdates: Set<string>;
  recurrenceId: Date | null;
};

const WEEKDAY_CODES: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

// "20260812T090000" (floating → local), "...Z" (UTC), "20260812" (date-only)
function parseIcsDate(value: string): { date: Date; dateOnly: boolean } {
  const dateOnly = /^\d{8}$/.test(value);
  const y = Number(value.slice(0, 4));
  const mo = Number(value.slice(4, 6)) - 1;
  const d = Number(value.slice(6, 8));
  if (dateOnly) return { date: new Date(y, mo, d), dateOnly: true };

  const h = Number(value.slice(9, 11));
  const mi = Number(value.slice(11, 13));
  const s = Number(value.slice(13, 15)) || 0;
  if (value.endsWith('Z')) return { date: new Date(Date.UTC(y, mo, d, h, mi, s)), dateOnly: false };
  return { date: new Date(y, mo, d, h, mi, s), dateOnly: false };
}

// Minute-resolution key used to match EXDATE / RECURRENCE-ID to instances.
function instanceKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`;
}

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

function unfold(text: string): string[] {
  return text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
}

function parseEvents(text: string): RawEvent[] {
  const events: RawEvent[] = [];
  let current: Partial<RawEvent> | null = null;

  for (const line of unfold(text)) {
    if (line === 'BEGIN:VEVENT') {
      current = { location: null, end: null, rrule: null, exdates: new Set(), recurrenceId: null };
      continue;
    }
    if (line === 'END:VEVENT') {
      if (current && current.uid && current.start && current.summary !== undefined) {
        events.push(current as RawEvent);
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const nameAndParams = line.slice(0, colon);
    const value = line.slice(colon + 1);
    const name = nameAndParams.split(';')[0].toUpperCase();

    switch (name) {
      case 'UID':
        current.uid = value;
        break;
      case 'SUMMARY':
        current.summary = unescapeText(value);
        break;
      case 'LOCATION':
        current.location = unescapeText(value) || null;
        break;
      case 'DTSTART': {
        const { date, dateOnly } = parseIcsDate(value);
        current.start = date;
        current.allDay = dateOnly;
        break;
      }
      case 'DTEND':
        current.end = parseIcsDate(value).date;
        break;
      case 'RRULE': {
        const rule = new Map<string, string>();
        for (const part of value.split(';')) {
          const [k, v] = part.split('=');
          if (k && v) rule.set(k.toUpperCase(), v);
        }
        current.rrule = rule;
        break;
      }
      case 'EXDATE':
        // May carry several comma-separated values on one line.
        for (const v of value.split(',')) {
          current.exdates!.add(instanceKey(parseIcsDate(v).date));
        }
        break;
      case 'RECURRENCE-ID':
        current.recurrenceId = parseIcsDate(value).date;
        break;
    }
  }

  return events;
}

// Yields occurrence start dates from the series start, in order. Bounded
// by `hardStop` so a malformed rule can't loop forever.
function* occurrences(event: RawEvent, hardStop: Date): Generator<Date> {
  const rule = event.rrule!;
  const freq = rule.get('FREQ');
  const interval = Math.max(1, Number(rule.get('INTERVAL') ?? '1'));
  const count = rule.get('COUNT') ? Number(rule.get('COUNT')) : Infinity;
  const until = rule.get('UNTIL') ? parseIcsDate(rule.get('UNTIL')!).date : null;

  let emitted = 0;
  const start = event.start;

  const emitLimit = (d: Date): boolean => {
    if (emitted >= count) return false;
    if (until && d > until) return false;
    if (d > hardStop) return false;
    return true;
  };

  if (freq === 'DAILY') {
    for (let i = 0; ; i++) {
      const d = addDays(start, i * interval);
      if (!emitLimit(d)) return;
      emitted++;
      yield d;
    }
  } else if (freq === 'WEEKLY') {
    const byday = (rule.get('BYDAY')?.split(',') ?? [])
      .map((code) => WEEKDAY_CODES[code.replace(/^[-+]?\d+/, '')])
      .filter((n): n is number => n !== undefined);
    const days = byday.length > 0 ? byday : [start.getDay()];

    // Walk day by day from the series start; a day belongs to the series
    // when its weekday matches and its week is `interval` weeks aligned.
    const startOfWeek = addDays(start, -start.getDay());
    for (let i = 0; ; i++) {
      const d = addDays(start, i);
      if (d > hardStop || (until && d > until) || emitted >= count) return;
      const weeksFromStart = Math.floor((addDays(d, -d.getDay()).getTime() - startOfWeek.getTime()) / (7 * 86_400_000));
      if (days.includes(d.getDay()) && weeksFromStart % interval === 0) {
        emitted++;
        yield d;
      }
    }
  } else if (freq === 'MONTHLY') {
    const dayOfMonth = rule.get('BYMONTHDAY') ? Number(rule.get('BYMONTHDAY')) : start.getDate();
    for (let i = 0; ; i++) {
      const d = new Date(start);
      d.setDate(1);
      d.setMonth(d.getMonth() + i * interval);
      d.setDate(dayOfMonth);
      // setDate overflowed into the next month → this month lacks the day.
      if (d.getDate() !== dayOfMonth) continue;
      if (!emitLimit(d)) return;
      if (d < start) continue;
      emitted++;
      yield d;
    }
  } else if (freq === 'YEARLY') {
    for (let i = 0; ; i++) {
      const d = new Date(start);
      d.setFullYear(d.getFullYear() + i * interval);
      if (!emitLimit(d)) return;
      emitted++;
      yield d;
    }
  } else {
    // Unknown FREQ — treat as non-recurring rather than guessing.
    if (emitLimit(start)) yield start;
  }
}

function toCalendarEvent(raw: RawEvent, start: Date): CalendarEvent {
  const durationMs = raw.end && !raw.allDay ? raw.end.getTime() - raw.start.getTime() : 0;
  const end = new Date(start.getTime() + durationMs);
  return {
    id: `${raw.uid}:${start.getTime()}`,
    summary: raw.summary,
    start: raw.allDay ? toDateStr(start) : start.toISOString(),
    end: raw.allDay ? toDateStr(end) : end.toISOString(),
    allDay: raw.allDay,
    location: raw.location,
  };
}

export function expandIcs(text: string, windowStart: Date, windowEnd: Date): CalendarEvent[] {
  const raws = parseEvents(text);

  // RECURRENCE-ID overrides replace specific instances of their series.
  const overridden = new Map<string, Set<string>>();
  for (const raw of raws) {
    if (!raw.recurrenceId) continue;
    const set = overridden.get(raw.uid) ?? new Set<string>();
    set.add(instanceKey(raw.recurrenceId));
    overridden.set(raw.uid, set);
  }

  const inWindow = (d: Date): boolean => d >= windowStart && d < windowEnd;
  const result: CalendarEvent[] = [];

  for (const raw of raws) {
    if (raw.rrule && !raw.recurrenceId) {
      const skips = overridden.get(raw.uid);
      for (const start of occurrences(raw, windowEnd)) {
        if (!inWindow(start)) continue;
        if (raw.exdates.has(instanceKey(start))) continue;
        if (skips?.has(instanceKey(start))) continue;
        result.push(toCalendarEvent(raw, start));
      }
    } else if (inWindow(raw.start)) {
      result.push(toCalendarEvent(raw, raw.start));
    }
  }

  result.sort((a, b) => a.start.localeCompare(b.start));
  return result;
}
