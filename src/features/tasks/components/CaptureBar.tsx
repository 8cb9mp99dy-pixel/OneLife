import { useState, type FormEvent } from 'react';
import { createTask } from '../api';
import { useAuth } from '../../auth/AuthProvider';
import { parseDate } from '../../../lib/dateParser/parseDate';

export default function CaptureBar() {
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !session || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const parsed = parseDate(trimmed, new Date());
      // If stripping the date keyword left nothing behind (e.g. the whole
      // input was just "demain"), keep the original text rather than
      // create a blank-titled task.
      const finalTitle = parsed.title.length > 0 ? parsed.title : trimmed;
      await createTask({ title: finalTitle, due_date: parsed.due_date }, session.user.id);
      setTitle('');
    } catch (err) {
      // Without this, a failed write left the input permanently disabled
      // with no explanation — this is what broke capture on iOS.
      setError(err instanceof Error ? err.message : 'Could not capture task');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-neutral-200 bg-white px-6 py-3 dark:border-neutral-800 dark:bg-black"
    >
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Capture a task…"
          disabled={submitting}
          className="field flex-1 text-base"
        />
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          aria-label="Add task"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white transition-colors duration-150 disabled:opacity-30 dark:bg-white dark:text-black"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
      {error && (
        <p className="mx-auto mt-1 max-w-lg text-xs text-neutral-500 dark:text-neutral-400">{error}</p>
      )}
    </form>
  );
}
