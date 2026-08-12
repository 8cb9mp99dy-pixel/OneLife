import { useState, type FormEvent } from 'react';
import { createTask } from '../api';
import { useAuth } from '../../auth/AuthProvider';
import { parseDate } from '../../../lib/dateParser/parseDate';

export default function CaptureBar() {
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !session || submitting) return;
    setSubmitting(true);

    const parsed = parseDate(trimmed, new Date());
    // If stripping the date keyword left nothing behind (e.g. the whole
    // input was just "demain"), keep the original text rather than create
    // a blank-titled task.
    const finalTitle = parsed.title.length > 0 ? parsed.title : trimmed;

    await createTask({ title: finalTitle, due_date: parsed.due_date }, session.user.id);
    setTitle('');
    setSubmitting(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-black"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Capture a task…"
        disabled={submitting}
        className="mx-auto block w-full max-w-lg border-b border-neutral-300 bg-transparent py-2 text-base outline-none focus:border-black disabled:opacity-50 dark:border-neutral-700 dark:focus:border-white"
      />
    </form>
  );
}
