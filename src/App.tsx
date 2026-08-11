import { useEffect } from 'react';
import { AuthProvider, useAuth } from './features/auth/AuthProvider';
import SignInScreen from './features/auth/SignInScreen';
import SyncStatusBadge from './features/settings/SyncStatusBadge';
import { supabase } from './lib/supabase';
import { pullAll } from './lib/sync/pull';
import { startFlushTriggers } from './lib/sync/flush';
import { startRealtimeSync } from './lib/sync/realtime';

function AuthGate() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!session) return;

    void pullAll();
    const onFocus = () => void pullAll();
    window.addEventListener('focus', onFocus);

    const stopFlushTriggers = startFlushTriggers();
    const stopRealtimeSync = startRealtimeSync();

    return () => {
      window.removeEventListener('focus', onFocus);
      stopFlushTriggers();
      stopRealtimeSync();
    };
  }, [session]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-black dark:bg-black dark:text-white">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>
      </main>
    );
  }

  if (!session) {
    return <SignInScreen />;
  }

  // Placeholder until the Today/Inbox/Habits/Settings screens land in
  // later phases — just enough to confirm sign-in and the sync layer.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white text-black dark:bg-black dark:text-white">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Signed in as {session.user.email}
      </p>
      <SyncStatusBadge />
      <button
        onClick={() => supabase.auth.signOut()}
        className="border border-black px-4 py-2 text-sm dark:border-white"
      >
        Sign out
      </button>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
