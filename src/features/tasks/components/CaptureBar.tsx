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
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Capture a task…"
        disabled={submitting}
        className="field mx-auto block max-w-lg text-base"
      />
      {error && (
        <p className="mx-auto mt-1 w-full max-w-lg text-xs text-neutral-500 dark:text-neutral-400">{error}</p>
      )}
    </form>
  );
}
