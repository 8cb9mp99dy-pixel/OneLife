import { useState, type FormEvent } from 'react';
import { useActiveHabits, createHabit } from './api';
import { useAuth } from '../auth/AuthProvider';
import HabitList from './components/HabitList';

export default function HabitsScreen() {
  const { session } = useAuth();
  const habits = useActiveHabits();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !session || submitting) return;
    setSubmitting(true);
    await createHabit({ name: trimmed }, session.user.id);
    setName('');
    setSubmitting(false);
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-40 pt-6">
      <h1 className="mb-4 text-lg font-medium">Habits</h1>
      <form onSubmit={handleSubmit} className="mb-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New habit…"
          disabled={submitting}
          className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm outline-none focus:border-black disabled:opacity-50 dark:border-neutral-700 dark:focus:border-white"
        />
      </form>
      <HabitList habits={habits} />
    </div>
  );
}
