import { describe, expect, it } from 'vitest';
import { expandIcs } from './ics';

// Window: Aug 10-17, 2026 (Aug 10 was a Monday). Dates built with the
// local-time Date constructor so tests pass in any timezone.
const WIN_START = new Date(2026, 7, 10);
const WIN_END = new Date(2026, 7, 17);

function ics(body: string): string {
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${body}\r\nEND:VCALENDAR`;
}

function event(lines: string[]): string {
  return `BEGIN:VEVENT\r\n${lines.join('\r\n')}\r\nEND:VEVENT`;
}

describe('expandIcs', () => {
  it('parses a simple timed event inside the window', () => {
    const text = ics(
      event(['UID:e1', 'DTSTART:20260812T090000', 'DTEND:20260812T100000', 'SUMMARY:Dentist']),
    );
    const events = expandIcs(text, WIN_START, WIN_END);
    expect(events).toHaveLength(1);
    expect(events[0].summary).toBe('Dentist');
    expect(events[0].allDay).toBe(false);
    expect(new Date(events[0].start).getHours()).toBe(9);
  });

  it('excludes events outside the window', () => {
    const text = ics(
      event(['UID:e1', 'DTSTART:20260901T090000', 'DTEND:20260901T100000', 'SUMMARY:Later']),
    );
    expect(expandIcs(text, WIN_START, WIN_END)).toHaveLength(0);
  });

  it('parses all-day events as date-only', () => {
    const text = ics(
      event(['UID:e1', 'DTSTART;VALUE=DATE:20260813', 'DTEND;VALUE=DATE:20260814', 'SUMMARY:Holiday']),
    );
    const events = expandIcs(text, WIN_START, WIN_END);
    expect(events).toHaveLength(1);
    expect(events[0].allDay).toBe(true);
    expect(events[0].start).toBe('2026-08-13');
  });

  it('unfolds continuation lines and unescapes text', () => {
    const text = ics(
      event([
        'UID:e1',
        'DTSTART:20260812T090000',
        'DTEND:20260812T100000',
        'SUMMARY:Lunch\\, then walk',
        'LOCATION:Café\r\n  du Coin',
      ]),
    );
    const events = expandIcs(text, WIN_START, WIN_END);
    expect(events[0].summary).toBe('Lunch, then walk');
    expect(events[0].location).toBe('Café du Coin');
  });

  it('expands a daily recurrence within the window', () => {
    const text = ics(
      event([
        'UID:e1',
        'DTSTART:20260801T080000',
        'DTEND:20260801T083000',
        'RRULE:FREQ=DAILY',
        'SUMMARY:Standup',
      ]),
    );
    const events = expandIcs(text, WIN_START, WIN_END);
    expect(events).toHaveLength(7); // Aug 10..16
  });

  it('respects INTERVAL and UNTIL on daily recurrence', () => {
    const text = ics(
      event([
        'UID:e1',
        'DTSTART:20260810T080000',
        'DTEND:20260810T083000',
        'RRULE:FREQ=DAILY;INTERVAL=2;UNTIL=20260814T235959Z',
        'SUMMARY:Every other day',
      ]),
    );
    const events = expandIcs(text, WIN_START, WIN_END);
    // Aug 10, 12, 14
    expect(events).toHaveLength(3);
  });

  it('expands weekly recurrence on BYDAY days only', () => {
    const text = ics(
      event([
        'UID:e1',
        'DTSTART:20260803T180000',
        'DTEND:20260803T190000',
        'RRULE:FREQ=WEEKLY;BYDAY=MO,WE',
        'SUMMARY:Gym',
      ]),
    );
    const events = expandIcs(text, WIN_START, WIN_END);
    // Mon Aug 10, Wed Aug 12, Mon Aug 17 is outside (window end exclusive)
    expect(events).toHaveLength(2);
    for (const e of events) {
      const day = new Date(e.start).getDay();
      expect([1, 3]).toContain(day);
    }
  });

  it('honours COUNT counted from the series start, not the window', () => {
    const text = ics(
      event([
        'UID:e1',
        'DTSTART:20260808T080000',
        'DTEND:20260808T083000',
        'RRULE:FREQ=DAILY;COUNT=4',
        'SUMMARY:Short series',
      ]),
    );
    const events = expandIcs(text, WIN_START, WIN_END);
    // Series: Aug 8, 9, 10, 11 — only 10 and 11 fall in the window.
    expect(events).toHaveLength(2);
  });

  it('skips EXDATE-cancelled instances', () => {
    const text = ics(
      event([
        'UID:e1',
        'DTSTART:20260810T080000',
        'DTEND:20260810T083000',
        'RRULE:FREQ=DAILY;COUNT=3',
        'EXDATE:20260811T080000',
        'SUMMARY:With a gap',
      ]),
    );
    const events = expandIcs(text, WIN_START, WIN_END);
    expect(events).toHaveLength(2); // Aug 10 and 12, not 11
  });

  it('replaces a recurring instance with its RECURRENCE-ID override', () => {
    const text = ics(
      [
        event([
          'UID:e1',
          'DTSTART:20260810T080000',
          'DTEND:20260810T083000',
          'RRULE:FREQ=DAILY;COUNT=3',
          'SUMMARY:Standup',
        ]),
        event([
          'UID:e1',
          'RECURRENCE-ID:20260811T080000',
          'DTSTART:20260811T140000',
          'DTEND:20260811T143000',
          'SUMMARY:Standup (moved)',
        ]),
      ].join('\r\n'),
    );
    const events = expandIcs(text, WIN_START, WIN_END);
    expect(events).toHaveLength(3);
    const moved = events.find((e) => e.summary === 'Standup (moved)');
    expect(moved).toBeDefined();
    expect(new Date(moved!.start).getHours()).toBe(14);
    // The original 08:00 slot on the 11th must be gone.
    const eightAmOnEleventh = events.filter(
      (e) => new Date(e.start).getDate() === 11 && new Date(e.start).getHours() === 8,
    );
    expect(eightAmOnEleventh).toHaveLength(0);
  });

  it('returns events sorted by start', () => {
    const text = ics(
      [
        event(['UID:b', 'DTSTART:20260813T150000', 'DTEND:20260813T160000', 'SUMMARY:Second']),
        event(['UID:a', 'DTSTART:20260811T090000', 'DTEND:20260811T100000', 'SUMMARY:First']),
      ].join('\r\n'),
    );
    const events = expandIcs(text, WIN_START, WIN_END);
    expect(events.map((e) => e.summary)).toEqual(['First', 'Second']);
  });
});
