import { supabase } from '../../lib/supabase';
import { expandIcs } from './ics';
import type { CalendarEvent } from './types';

// Apple Calendar integration via the calendar's published ("Public
// Calendar") webcal link. iCloud doesn't send CORS headers, so the feed
// is relayed through the ical-proxy Supabase Edge Function — see
// supabase/functions/ical-proxy/index.ts. Read-only throughout: nothing
// is written to Apple, Supabase tables, or the outbox.

const URL_KEY = 'ical_url';
const CACHE_KEY = 'ical_events_cache';

export function getFeedUrl(): string | null {
  return localStorage.getItem(URL_KEY);
}

export function setFeedUrl(url: string): void {
  localStorage.setItem(URL_KEY, url.trim());
}

export function clearFeedUrl(): void {
  localStorage.removeItem(URL_KEY);
  localStorage.removeItem(CACHE_KEY);
}

export async function fetchUpcomingEvents(feedUrl: string): Promise<CalendarEvent[]> {
  const { data, error } = await supabase.functions.invoke('ical-proxy', {
    body: { url: feedUrl },
  });
  if (error) throw new Error(`Calendar feed request failed: ${error.message}`);
  if (typeof data !== 'string') throw new Error('Calendar feed returned an unexpected response');

  const windowStart = new Date();
  windowStart.setHours(0, 0, 0, 0);
  const windowEnd = new Date(windowStart);
  windowEnd.setDate(windowEnd.getDate() + 7);

  const events = expandIcs(data, windowStart, windowEnd);
  localStorage.setItem(CACHE_KEY, JSON.stringify({ fetched_at: Date.now(), events }));
  return events;
}

export function getCachedEvents(): { fetchedAt: number; events: CalendarEvent[] } | null {
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { fetched_at: number; events: CalendarEvent[] };
    return { fetchedAt: parsed.fetched_at, events: parsed.events };
  } catch {
    return null;
  }
}
