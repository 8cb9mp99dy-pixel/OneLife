import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import SyncStatusBadge from './SyncStatusBadge';
import InstallInstructions from './InstallInstructions';

export default function SettingsScreen() {
  const { session } = useAuth();

  return (
    <div className="mx-auto max-w-lg px-6 pb-40 pt-6">
      <h1 className="mb-4 text-lg font-medium">Settings</h1>

      <div className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <div>
          <p className="text-sm">{session?.user.email}</p>
          <div className="mt-1">
            <SyncStatusBadge />
          </div>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-md border border-black px-3 py-1 text-xs transition-colors duration-150 hover:bg-black hover:text-white dark:border-white dark:hover:bg-white dark:hover:text-black"
        >
          Sign out
        </button>
      </div>

      <InstallInstructions />
    </div>
  );
}
