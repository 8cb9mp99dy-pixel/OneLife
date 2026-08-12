export type CalendarEvent = {
  id: string;
  summary: string;
  start: string; // ISO datetime, or YYYY-MM-DD for all-day events
  end: string;
  allDay: boolean;
  location: string | null;
};
