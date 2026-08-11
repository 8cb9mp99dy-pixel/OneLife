import { supabase } from '../supabase';
import { pullAll } from './pull';

// A convenience nudge on top of the outbox/pull design (see CLAUDE.md),
// not a replacement for it: any change on the four synced tables triggers
// an extra pull so other devices update closer to instantly, with the
// existing focus/interval/online polling remaining as the fallback if a
// Realtime event is ever missed.
export function startRealtimeSync(): () => void {
  const channel = supabase
    .channel('onelife-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'area' }, () => void pullAll())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'task' }, () => void pullAll())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'habit' }, () => void pullAll())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'habit_log' }, () => void pullAll())
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
