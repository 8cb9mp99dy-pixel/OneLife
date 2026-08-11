import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

// Exposed for manual RLS verification via the browser console (Phase 1
// done-criteria: verify through the client SDK, not the SQL editor). The
// anon key is already public in the built bundle, so this adds no new
// exposure.
if (typeof window !== 'undefined') {
  (window as unknown as { supabase: typeof supabase }).supabase = supabase;
}
