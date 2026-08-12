import type { CalendarEvent } from './types';
import { clearToken } from './googleAuth';

const CACHE_KEY = 'gcal_events_cache';

type GoogleEventItem = {
  id: string;
  summary?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
};

export class TokenExpiredError extends Error {
  constructor() {
    super('Google session expired');
  }
}

// Read-only pull of the next 7 days from the primary calendar. Google is
// the source of truth here — nothing is written back, to Google or to
// Supabase; the only local artifact is a last-fetch cache for offline.
export async function fetchUpcomingEvents(accessToken: string): Promise<CalendarEvent[]> {
  const timeMin = new Date();
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + 7);

  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (res.status === 401 || res.status === 403) {
    clearToken();
    throw new TokenExpiredError();
  }
  if (!res.ok) throw new Error(`Google Calendar request failed (${res.status})`);

  const body = (await res.json()) as { items?: GoogleEventItem[] };
  const events: CalendarEvent[] = (body.items ?? []).map((item) => ({
    id: item.id,
    summary: item.summary ?? '(no title)',
    start: item.start.dateTime ?? item.start.date ?? '',
    end: item.end.dateTime ?? item.end.date ?? '',
    allDay: !item.start.dateTime,
    location: item.location ?? null,
  }));

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
