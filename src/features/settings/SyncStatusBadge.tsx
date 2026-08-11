import { useSyncStatus } from '../../hooks/useSyncStatus';

export default function SyncStatusBadge() {
  const status = useSyncStatus();

  const label =
    status === 'synced'
      ? 'Synced'
      : status === 'offline'
        ? 'Offline'
        : status === 'error'
          ? 'Sync error'
          : `${status.pending} pending`;

  return <p className="text-xs text-neutral-400 dark:text-neutral-500">{label}</p>;
}
