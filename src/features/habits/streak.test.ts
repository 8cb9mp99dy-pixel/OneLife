import { describe, expect, it } from 'vitest';
import { calculateStreak } from './streak';

// Jan 1, 2024 was a Monday (see parseDate.test.ts for the same anchor).
// Jan 1 Mon, 2 Tue, 3 Wed, 4 Thu, 5 Fri, 6 Sat, 7 Sun, 8 Mon.
const WED_JAN3 = new Date(2024, 0, 3);
const FRI_JAN5 = new Date(2024, 0, 5);

function log(date: string, done: boolean, deleted = false) {
  return { log_date: date, done, deleted };
}

describe('calculateStreak', () => {
  it('counts consecutive done days ending today, for a daily habit', () => {
    const logs = [log('2024-01-03', true), log('2024-01-02', true), log('2024-01-01', true)];
    expect(calculateStreak({ target_days: null }, logs, WED_JAN3)).toBe(3);
  });

  it('stops at the first missing scheduled day walking backward', () => {
    const logs = [log('2024-01-03', true), log('2024-01-02', true)]; // Jan 1 missing
    expect(calculateStreak({ target_days: null }, logs, WED_JAN3)).toBe(2);
  });

  it('skips non-scheduled days without breaking the streak', () => {
    // target_days = [Mon, Wed, Fri]. Today is Friday. Tue/Thu have no
    // logs at all (not scheduled) but must not break the chain.
    const logs = [log('2024-01-05', true), log('2024-01-03', true), log('2024-01-01', true)];
    expect(calculateStreak({ target_days: [1, 3, 5] }, logs, FRI_JAN5)).toBe(3);
  });

  it('gives today a grace period: unlogged today falls back to checking yesterday', () => {
    const logs = [log('2024-01-02', true)]; // nothing for Jan 3 (today)
    expect(calculateStreak({ target_days: null }, logs, WED_JAN3)).toBe(1);
  });

  it('does NOT give a grace period when today is explicitly logged done=false', () => {
    const logs = [log('2024-01-03', false), log('2024-01-02', true), log('2024-01-01', true)];
    expect(calculateStreak({ target_days: null }, logs, WED_JAN3)).toBe(0);
  });

  it('counts today when it is explicitly logged done=true', () => {
    const logs = [log('2024-01-03', true)];
    expect(calculateStreak({ target_days: null }, logs, WED_JAN3)).toBe(1);
  });

  it('treats a soft-deleted log for today as "not logged" (grace period applies), not as an explicit false', () => {
    const logs = [log('2024-01-03', true, true), log('2024-01-02', true)];
    expect(calculateStreak({ target_days: null }, logs, WED_JAN3)).toBe(1);
  });

  it('returns 0 when nothing has ever been logged', () => {
    expect(calculateStreak({ target_days: null }, [], WED_JAN3)).toBe(0);
  });
});
