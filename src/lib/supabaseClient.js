import { createClient } from "@supabase/supabase-js";

// Try multiple possible env var names to be tolerant of different setups
// Preferred for Vite apps: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
const env =
  (typeof import.meta !== "undefined" && import.meta.env) ||
  (typeof process !== "undefined" && process.env) ||
  {};

const supabaseUrl =
  env.VITE_SUPABASE_URL ||
  env.NEXT_PUBLIC_SUPABASE_URL ||
  env.SUPABASE_URL ||
  env.PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  env.SUPABASE_ANON_KEY ||
  env.SUPABASE_PUBLIC_KEY;

export const MISSING_CREDENTIALS_MESSAGE =
  "Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.";

/**
 * Stands in for the real client when the credentials are missing.
 *
 * `createClient` throws synchronously on an empty URL, which happened while the
 * module was being imported — the app died on a white screen before React
 * could render anything (and no error boundary could catch it). The stub keeps
 * the same chainable shape and resolves every query with a readable error, so
 * the UI can show what is actually wrong.
 */
function createMissingConfigClient(message) {
  function builder() {
    const chain = {
      select: () => chain,
      insert: () => chain,
      update: () => chain,
      upsert: () => chain,
      delete: () => chain,
      eq: () => chain,
      neq: () => chain,
      in: () => chain,
      order: () => chain,
      limit: () => chain,
      range: () => chain,
      maybeSingle: () => chain,
      single: () => chain,
      then: (onFulfilled, onRejected) =>
        Promise.resolve({ data: null, error: { message } }).then(
          onFulfilled,
          onRejected,
        ),
    };
    return chain;
  }

  return {
    from: builder,
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe() {} } },
      }),
    },
  };
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase credentials not found in env. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Vite) or NEXT_PUBLIC equivalents.",
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMissingConfigClient(MISSING_CREDENTIALS_MESSAGE);

// Example helpers (use these from the app components)
export async function fetchPeople() {
  return supabase
    .from("people")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function fetchWeightsForPerson(person_id) {
  return supabase
    .from("weights")
    .select("*")
    .eq("person_id", person_id)
    .order("date", { ascending: false });
}
