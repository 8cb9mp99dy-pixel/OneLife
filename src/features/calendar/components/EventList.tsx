import type { CalendarEvent } from '../types';

function dayKey(event: CalendarEvent): string {
  // All-day events carry YYYY-MM-DD already; timed ones get their local date.
  if (event.allDay) return event.start;
  const d = new Date(event.start);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayLabel(key: string): string {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (key === todayKey) return 'Today';

  const date = new Date(`${key}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function timeLabel(event: CalendarEvent): string {
  if (event.allDay) return 'All day';
  return new Date(event.start).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function EventList({ events }: { events: CalendarEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
        Nothing in the next 7 days.
      </p>
    );
  }

  const groups = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = dayKey(event);
    const group = groups.get(key) ?? [];
    group.push(event);
    groups.set(key, group);
  }

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([key, dayEvents]) => (
        <section key={key}>
          <h2 className="mb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {dayLabel(key)}
          </h2>
          <ul>
            {dayEvents.map((event) => (
              <li
                key={event.id}
                className="flex items-baseline gap-3 border-b border-neutral-200 py-3 dark:border-neutral-800"
              >
                <span className="w-16 shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
                  {timeLabel(event)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{event.summary}</p>
                  {event.location && (
                    <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">
                      {event.location}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
