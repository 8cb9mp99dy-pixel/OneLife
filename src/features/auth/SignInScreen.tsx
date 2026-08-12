import { useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError(signInError.message);
    setSubmitting(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-black dark:bg-black dark:text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <h1 className="text-lg font-medium">OneLife</h1>

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm text-neutral-500 dark:text-neutral-400">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm text-neutral-500 dark:text-neutral-400">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
        </div>

        {error && <p className="text-sm text-neutral-500 dark:text-neutral-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg border border-black py-2 text-sm transition-colors duration-150 hover:bg-black hover:text-white disabled:opacity-50 dark:border-white dark:hover:bg-white dark:hover:text-black"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
