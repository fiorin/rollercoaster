import { createClient } from "@supabase/supabase-js";

// Try multiple possible env var names to be tolerant of different setups
// Preferred for Vite apps: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
const env = typeof import.meta !== "undefined" ? import.meta.env : process.env;

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

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials not found in env. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Vite) or NEXT_PUBLIC equivalents.",
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");

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
