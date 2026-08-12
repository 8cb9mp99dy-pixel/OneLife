import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { getClientId, setClientId, getAccessToken, startConnect, disconnect } from './googleAuth';
import { fetchUpcomingEvents, getCachedEvents, TokenExpiredError } from './api';
import type { CalendarEvent } from './types';
import EventList from './components/EventList';

type Status = 'setup' | 'disconnected' | 'loading' | 'ready' | 'expired' | 'error';

export default function CalendarScreen() {
  const [status, setStatus] = useState<Status>('loading');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [clientIdInput, setClientIdInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!getClientId()) {
      setStatus('setup');
      return;
    }
    const token = getAccessToken();
    const cached = getCachedEvents();
    if (cached) setEvents(cached.events);

    if (!token) {
      setStatus(cached ? 'expired' : 'disconnected');
      return;
    }

    setStatus('loading');
    try {
      setEvents(await fetchUpcomingEvents(token));
      setStatus('ready');
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        setStatus('expired');
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Could not load events');
        setStatus(cached ? 'expired' : 'error');
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function handleSaveClientId(e: FormEvent) {
    e.preventDefault();
    const trimmed = clientIdInput.trim();
    if (!trimmed) return;
    setClientId(trimmed);
    setClientIdInput('');
    setStatus('disconnected');
  }

  return (
    <div className="mx-auto max-w-lg px-6 pb-40 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-medium">Calendar</h1>
        {(status === 'ready' || status === 'expired') && (
          <div className="flex gap-3 text-xs">
            <button
              onClick={() => void load()}
              className="text-neutral-400 transition-colors duration-150 hover:text-black dark:text-neutral-500 dark:hover:text-white"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                disconnect();
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
        <form onSubmit={handleSaveClientId} className="space-y-3">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Paste your Google OAuth Client ID to connect your calendar (read-only). It's created
            once in Google Cloud Console — see the setup steps you were given.
          </p>
          <input
            value={clientIdInput}
            onChange={(e) => setClientIdInput(e.target.value)}
            placeholder="xxxxx.apps.googleusercontent.com"
            className="field"
          />
          <button
            type="submit"
            disabled={!clientIdInput.trim()}
            className="w-full rounded-lg border border-black py-2 text-sm transition-colors duration-150 hover:bg-black hover:text-white disabled:opacity-30 dark:border-white dark:hover:bg-white dark:hover:text-black"
          >
            Save
          </button>
        </form>
      )}

      {status === 'disconnected' && (
        <button
          onClick={startConnect}
          className="w-full rounded-lg border border-black py-2 text-sm transition-colors duration-150 hover:bg-black hover:text-white dark:border-white dark:hover:bg-white dark:hover:text-black"
        >
          Connect Google Calendar
        </button>
      )}

      {status === 'loading' && (
        <p className="py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">Loading…</p>
      )}

      {status === 'expired' && (
        <div className="mb-4 space-y-2">
          <button
            onClick={startConnect}
            className="w-full rounded-lg border border-black py-2 text-sm transition-colors duration-150 hover:bg-black hover:text-white dark:border-white dark:hover:bg-white dark:hover:text-black"
          >
            Reconnect
          </button>
          {events.length > 0 && (
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              Google session expired — showing the last fetched events.
            </p>
          )}
        </div>
      )}

      {status === 'error' && (
        <p className="py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
          {errorMessage ?? 'Could not load events.'}
        </p>
      )}

      {(status === 'ready' || (status === 'expired' && events.length > 0)) && (
        <EventList events={events} />
      )}
    </div>
  );
}
