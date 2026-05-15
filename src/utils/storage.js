import { supabase } from "../lib/supabaseClient";

// People
export async function loadPeople() {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("loadPeople error", error);
    return [];
  }
  return data || [];
}

export async function savePeople(list) {
  if (!Array.isArray(list)) {
    throw new Error("savePeople expects an array");
  }
  const { data, error } = await supabase.from("people").upsert(list);
  if (error) {
    console.error("savePeople error", error);
    throw error;
  }
  return data;
}

// Weights
export async function loadWeights() {
  // use the view that joins people info if available
  const { data, error } = await supabase
    .from("weights_with_people")
    .select("*")
    .order("date", { ascending: false });
  if (error) {
    console.error("loadWeights error", error);
    return [];
  }
  // Transform from DB schema to component schema (snake_case -> camelCase)
  return (data || []).map((w) => ({
    id: w.id,
    date: w.date,
    kg: w.weight,
    personId: w.person_id,
    person_name: w.person_name,
    activities: {
      gym: w.gym || false,
      bike: w.bike || false,
      boxing: w.gloves || false, // map gloves to boxing for UI
      run: w.running || false,
    },
  }));
}

export async function saveWeights(list) {
  if (!Array.isArray(list)) {
    throw new Error("saveWeights expects an array");
  }
  // Transform from component schema back to DB schema
  const toSave = list.map((w) => ({
    id: w.id,
    date: w.date,
    weight: w.kg,
    person_id: w.personId,
    gym: w.activities?.gym || false,
    bike: w.activities?.bike || false,
    gloves: w.activities?.boxing || false, // map boxing back to gloves
    running: w.activities?.run || false,
  }));
  const { data, error } = await supabase.from("weights").upsert(toSave);
  if (error) {
    console.error("saveWeights error", error);
    throw error;
  }
  return data;
}

// UUID helper — generate a valid UUID
export function uid() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  // Fallback UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
