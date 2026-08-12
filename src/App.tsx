import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './features/auth/AuthProvider';
import SignInScreen from './features/auth/SignInScreen';
import SyncStatusBadge from './features/settings/SyncStatusBadge';
import InboxScreen from './features/tasks/InboxScreen';
import TodayScreen from './features/today/TodayScreen';
import CaptureBar from './features/tasks/components/CaptureBar';
import BottomTabBar, { type Screen } from './components/BottomTabBar';
import { supabase } from './lib/supabase';
import { pullAll } from './lib/sync/pull';
import { startFlushTriggers } from './lib/sync/flush';
import { startRealtimeSync } from './lib/sync/realtime';

// Mirrors the active screen to location.hash so refresh/back doesn't dump
// you back to Today — a few lines of state, not a routing library.
function useScreen(): [Screen, (screen: Screen) => void] {
  const fromHash = (): Screen => (window.location.hash === '#inbox' ? 'inbox' : 'today');
  const [screen, setScreen] = useState<Screen>(fromHash);

  useEffect(() => {
    window.location.hash = screen;
  }, [screen]);

  useEffect(() => {
    const onHashChange = () => setScreen(fromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return [screen, setScreen];
}

function AuthGate() {
  const { session, loading } = useAuth();
  const [screen, setScreen] = useScreen();

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

      {screen === 'today' ? <TodayScreen /> : <InboxScreen />}

      <div className="fixed inset-x-0 bottom-0">
        <CaptureBar />
        <BottomTabBar active={screen} onChange={setScreen} />
      </div>
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
