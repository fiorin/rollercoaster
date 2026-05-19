import { supabase } from "../lib/supabaseClient";

function normalizeWeightRecord(w) {
  return {
    id: w.id,
    date: w.date,
    weight: w.kg,
    person_id: w.personId,
    gym: w.activities?.gym || false,
    bike: w.activities?.bike || false,
    gloves: w.activities?.boxing || false,
    running: w.activities?.run || false,
  };
}

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

export async function savePerson(person) {
  if (!person || typeof person !== "object") {
    throw new Error("savePerson expects an object");
  }
  const { data, error } = await supabase.from("people").upsert([person]);
  if (error) {
    console.error("savePerson error", error);
    throw error;
  }
  return data;
}

export async function deletePerson(id) {
  if (!id) {
    throw new Error("deletePerson expects an id");
  }
  const { data, error } = await supabase.from("people").delete().eq("id", id);
  if (error) {
    console.error("deletePerson error", error);
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
  return (data || []).map((w) => ({
    id: w.id,
    date: w.date,
    kg: w.weight,
    personId: w.person_id,
    person_name: w.person_name,
    activities: {
      gym: w.gym || false,
      bike: w.bike || false,
      boxing: w.gloves || false,
      run: w.running || false,
    },
  }));
}

export async function saveWeights(list) {
  if (!Array.isArray(list)) {
    throw new Error("saveWeights expects an array");
  }
  const toSave = list.map(normalizeWeightRecord);
  const { data, error } = await supabase.from("weights").upsert(toSave);
  if (error) {
    console.error("saveWeights error", error);
    throw error;
  }
  return data;
}

export async function saveWeight(weight) {
  if (!weight || typeof weight !== "object") {
    throw new Error("saveWeight expects an object");
  }
  const { data, error } = await supabase
    .from("weights")
    .upsert([normalizeWeightRecord(weight)]);
  if (error) {
    console.error("saveWeight error", error);
    throw error;
  }
  return data;
}

export async function deleteWeight(id) {
  if (!id) {
    throw new Error("deleteWeight expects an id");
  }
  const { data, error } = await supabase.from("weights").delete().eq("id", id);
  if (error) {
    console.error("deleteWeight error", error);
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
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
