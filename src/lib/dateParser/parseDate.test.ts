import { describe, expect, it } from 'vitest';
import { parseDate } from './parseDate';

// Jan 1, 2024 was a Monday (verifiable fact, not derived from the parser
// itself) — used as a fixed anchor so weekday-math tests aren't circular.
// Jan 1 Mon, 2 Tue, 3 Wed, 4 Thu, 5 Fri, 6 Sat, 7 Sun, 8 Mon.
const MON = new Date(2024, 0, 1);
const WED = new Date(2024, 0, 3);

describe('parseDate', () => {
  it('parses "tomorrow" (EN) and strips only that token', () => {
    const result = parseDate('Buy milk tomorrow', MON);
    expect(result.due_date).toBe('2024-01-02');
    expect(result.title).toBe('Buy milk');
    expect(result.matchedToken).toBe('tomorrow');
  });

  it('parses "demain" (FR) and strips only that token', () => {
    const result = parseDate('Acheter du lait demain', MON);
    expect(result.due_date).toBe('2024-01-02');
    expect(result.title).toBe('Acheter du lait');
  });

  it('parses "tonight" (EN) as today, not a time field', () => {
    const result = parseDate('Call mom tonight', MON);
    expect(result.due_date).toBe('2024-01-01');
    expect(result.title).toBe('Call mom');
  });

  it('parses "ce soir" (FR) as today', () => {
    const result = parseDate('Appeler maman ce soir', MON);
    expect(result.due_date).toBe('2024-01-01');
    expect(result.title).toBe('Appeler maman');
  });

  it('resolves a bare weekday to the NEXT occurrence strictly after today, even when today is that weekday', () => {
    // Today is Monday; typing "lundi" must mean next Monday, not today.
    const result = parseDate('Gym lundi', MON);
    expect(result.due_date).toBe('2024-01-08');
    expect(result.title).toBe('Gym');
  });

  it('resolves an English weekday name the same way', () => {
    const result = parseDate('Gym monday', MON);
    expect(result.due_date).toBe('2024-01-08');
  });

  it('resolves a weekday later in the same week correctly', () => {
    // Today is Wednesday Jan 3; "vendredi" (Friday) is Jan 5.
    const result = parseDate('Rendu vendredi', WED);
    expect(result.due_date).toBe('2024-01-05');
  });

  it('parses "dans N jours" (FR)', () => {
    const result = parseDate('Rendre le livre dans 3 jours', MON);
    expect(result.due_date).toBe('2024-01-04');
    expect(result.title).toBe('Rendre le livre');
  });

  it('parses "in N days" (EN)', () => {
    const result = parseDate('Return the book in 5 days', MON);
    expect(result.due_date).toBe('2024-01-06');
    expect(result.title).toBe('Return the book');
  });

  it('leaves time-of-day text untouched and unparsed', () => {
    const result = parseDate('Meeting at 8am', MON);
    expect(result.due_date).toBeNull();
    expect(result.matchedToken).toBeNull();
    expect(result.title).toBe('Meeting at 8am');
  });

  it('strips only the date keyword when time-of-day text is also present', () => {
    const result = parseDate('Meeting tomorrow at 8am', MON);
    expect(result.due_date).toBe('2024-01-02');
    expect(result.title).toBe('Meeting at 8am');
  });

  it('passes through untouched when no keyword matches', () => {
    const result = parseDate('Just a normal task', MON);
    expect(result.due_date).toBeNull();
    expect(result.matchedToken).toBeNull();
    expect(result.title).toBe('Just a normal task');
  });

  it('matches keywords case-insensitively', () => {
    const result = parseDate('Buy milk TOMORROW', MON);
    expect(result.due_date).toBe('2024-01-02');
    expect(result.title).toBe('Buy milk');
  });
});
