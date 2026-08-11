import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useOnlineStatus } from './useOnlineStatus';

export type SyncStatus = 'synced' | 'offline' | 'error' | { pending: number };

// Repeated flush failures (see nextBackoffDelay's cap) surface as an
// error state rather than sitting silently "pending" forever.
const ERROR_THRESHOLD_ATTEMPTS = 3;

export function useSyncStatus(): SyncStatus {
  const online = useOnlineStatus();
  const pendingRows = useLiveQuery(() => db.outbox.toArray(), [], []);

  if (!online) return 'offline';
  if (pendingRows.some((row) => row.attempts >= ERROR_THRESHOLD_ATTEMPTS)) return 'error';
  if (pendingRows.length > 0) return { pending: pendingRows.length };
  return 'synced';
}
