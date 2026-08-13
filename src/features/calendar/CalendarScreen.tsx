import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { getFeedUrl, setFeedUrl, clearFeedUrl, fetchUpcomingEvents, getCachedEvents } from './icloud';
import type { CalendarEvent } from './types';
import EventList from './components/EventList';

type Status = 'setup' | 'loading' | 'ready' | 'error';

// Auto-update cadence while the tab is open. Apple pushes changes to
// published feeds with its own delay on top of this — usually minutes.
const REFRESH_INTERVAL_MS = 15 * 60_000;

export default function CalendarScreen() {
  const [status, setStatus] = useState<Status>('loading');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const feedUrl = getFeedUrl();
    if (!feedUrl) {
      setStatus('setup');
      return;
    }

    const cached = getCachedEvents();
    if (cached) setEvents(cached.events);
    setStatus(cached ? 'ready' : 'loading');

    try {
      setEvents(await fetchUpcomingEvents(feedUrl));
      setErrorMessage(null);
      setStatus('ready');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not load the calendar feed');
      // Keep showing cached events if there are any; only hard-fail empty.
      setStatus(cached ? 'ready' : 'error');
    }
  }, []);

  useEffect(() => {
    void load();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(() => void load(), REFRESH_INTERVAL_MS);

    return () => {
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, [load]);

  function handleSaveUrl(e: FormEvent) {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setFeedUrl(trimmed);
    setUrlInput('');
    void load();
  }

  return (
    <div className="mx-auto max-w-lg px-6 pb-40 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-medium">Agenda</h1>
        {status === 'ready' && (
          <div className="flex gap-3 text-xs">
            <button
              onClick={() => void load()}
              className="text-neutral-400 transition-colors duration-150 hover:text-black dark:text-neutral-500 dark:hover:text-white"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                clearFeedUrl();
                setEvents([]);
                setStatus('setup');
              }}
              className="text-neutral-400 transition-colors duration-150 hover:text-black dark:text-neutral-500 dark:hover:text-white"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {status === 'setup' && (
        <form onSubmit={handleSaveUrl} className="space-y-3">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Paste your Apple Calendar public link (webcal://…). On iPhone: Calendar app →
            Calendars → tap ⓘ next to the calendar → enable Public Calendar → Share Link →
            Copy. Read-only — the app never changes your calendar.
          </p>
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="webcal://p12-caldav.icloud.com/published/…"
            className="field"
          />
          <button
            type="submit"
            disabled={!urlInput.trim()}
            className="w-full rounded-lg border border-black py-2 text-sm transition-colors duration-150 hover:bg-black hover:text-white disabled:opacity-30 dark:border-white dark:hover:bg-white dark:hover:text-black"
          >
            Connect
          </button>
        </form>
      )}

      {status === 'loading' && (
        <p className="py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">Loading…</p>
      )}

      {status === 'error' && (
        <div className="space-y-3 py-8 text-center">
          <p className="text-sm text-neutral-400 dark:text-neutral-500">
            {errorMessage ?? 'Could not load the calendar feed.'}
          </p>
          <button
            onClick={() => {
              clearFeedUrl();
              setStatus('setup');
            }}
            className="text-xs text-neutral-400 underline transition-colors duration-150 hover:text-black dark:text-neutral-500 dark:hover:text-white"
          >
            Use a different link
          </button>
        </div>
      )}

      {status === 'ready' && (
        <>
          {errorMessage && (
            <p className="mb-3 text-xs text-neutral-400 dark:text-neutral-500">
              Refresh failed — showing the last fetched events.
            </p>
          )}
          <EventList events={events} />
        </>
      )}
    </div>
  );
}
