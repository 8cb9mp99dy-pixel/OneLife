import { useEffect } from 'react';
import { AuthProvider, useAuth } from './features/auth/AuthProvider';
import SignInScreen from './features/auth/SignInScreen';
import SyncStatusBadge from './features/settings/SyncStatusBadge';
import InboxScreen from './features/tasks/InboxScreen';
import CaptureBar from './features/tasks/components/CaptureBar';
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

  // No tab bar yet — Today and Habits don't exist until Phases 5/6, and a
  // bar with placeholder tabs for unbuilt screens isn't worth it yet.
  // Inbox is the only real screen right now, so it's just shown directly.
  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <SyncStatusBadge />
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-xs text-neutral-400 hover:text-black dark:text-neutral-500 dark:hover:text-white"
        >
          Sign out
        </button>
      </header>
      <InboxScreen />
      <CaptureBar />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
