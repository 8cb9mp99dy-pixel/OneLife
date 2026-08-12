import { useState, type FormEvent } from 'react';
import { useActiveHabits, createHabit } from './api';
import { useAuth } from '../auth/AuthProvider';
import HabitList from './components/HabitList';

export default function HabitsScreen() {
  const { session } = useAuth();
  const habits = useActiveHabits();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !session || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      await createHabit({ name: trimmed }, session.user.id);
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add habit');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 pb-40 pt-6">
      <h1 className="mb-4 text-lg font-medium">Habits</h1>
      <form onSubmit={handleSubmit} className="mb-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New habit…"
          disabled={submitting}
          className="field"
        />
        {error && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{error}</p>}
      </form>
      <HabitList habits={habits} />
    </div>
  );
}
