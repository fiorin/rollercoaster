import { dateKey } from "./date";

/**
 * The Supabase client is loaded on demand.
 *
 * `@supabase/supabase-js` is ~50 kB gzipped and is only needed once a query
 * runs. Importing it statically put it in the critical path, so the first
 * paint had to wait for the whole client to download. The dynamic import keeps
 * it in a separate chunk that the app fetches in the background while the
 * shell is already on screen.
 */
let clientPromise = null;

function getSupabase() {
  if (!clientPromise) {
    clientPromise = import("../lib/supabaseClient").then(
      (module) => module.supabase,
    );
  }
  return clientPromise;
}

const WEIGHT_COLUMNS =
  "id, date, weight, person_id, gym, bike, gloves, running, notes";
const PERSON_COLUMNS = "id, name, avatar_id, created_at";

function toWeightRecord(row) {
  return {
    id: row.id,
    date: dateKey(row.date),
    kg: row.weight == null ? null : Number(row.weight),
    personId: row.person_id,
    notes: row.notes || "",
    activities: {
      gym: !!row.gym,
      bike: !!row.bike,
      boxing: !!row.gloves,
      run: !!row.running,
    },
  };
}

function toWeightRow(record) {
  const row = {
    date: dateKey(record.date),
    weight: Number(record.kg),
    person_id: record.personId,
    gym: !!record.activities?.gym,
    bike: !!record.activities?.bike,
    gloves: !!record.activities?.boxing,
    running: !!record.activities?.run,
    notes: record.notes || null,
  };
  // Leaving `id` out entirely lets Postgres/PostgREST keep the existing row id
  // when the insert is resolved through the (person_id, date) conflict target.
  if (record.id) row.id = record.id;
  return row;
}

function isUniqueViolation(error) {
  return (
    error?.code === "23505" ||
    /duplicate key|already exists/i.test(error?.message || "")
  );
}

function wrap(error, action) {
  const err = new Error(
    error?.message || `Falha ao ${action}. Verifique sua conexão.`,
  );
  err.cause = error;
  err.code = error?.code;
  return err;
}

// People

export async function loadPeople() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("people")
    .select(PERSON_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw wrap(error, "carregar pessoas");
  return data || [];
}

export async function savePeople(list) {
  if (!Array.isArray(list)) {
    throw new Error("savePeople expects an array");
  }
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("people").upsert(list);
  if (error) throw wrap(error, "salvar pessoas");
  return data;
}

export async function savePerson(person) {
  if (!person || typeof person !== "object") {
    throw new Error("savePerson expects an object");
  }
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("people")
    .upsert([person], { onConflict: "id" });
  if (error) throw wrap(error, "salvar pessoa");
  return data;
}

export async function deletePerson(id) {
  if (!id) {
    throw new Error("deletePerson expects an id");
  }
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("people").delete().eq("id", id);
  if (error) throw wrap(error, "excluir pessoa");
  return data;
}

// Weights

export async function loadWeights(personId) {
  const supabase = await getSupabase();
  let query = supabase
    .from("weights")
    .select(WEIGHT_COLUMNS)
    .order("date", { ascending: false });
  if (personId) query = query.eq("person_id", personId);

  const { data, error } = await query;
  if (error) throw wrap(error, "carregar pesos");
  return (data || []).map(toWeightRecord);
}

/**
 * Saves a batch of entries.
 *
 * The database enforces UNIQUE(person_id, date), so a row without an id must
 * resolve against that constraint — otherwise the whole batch fails with 23505
 * as soon as one of the imported dates already exists.
 */
export async function saveWeights(list) {
  if (!Array.isArray(list)) {
    throw new Error("saveWeights expects an array");
  }
  if (!list.length) return [];

  const supabase = await getSupabase();
  const rows = list.map(toWeightRow);
  const withId = rows.filter((row) => row.id);
  const withoutId = rows.filter((row) => !row.id);

  const saved = [];

  if (withId.length) {
    const { data, error } = await supabase
      .from("weights")
      .upsert(withId, { onConflict: "id" });
    if (error) throw wrap(error, "salvar pesos");
    saved.push(...(data || []).map(toWeightRecord));
  }

  if (withoutId.length) {
    const { data, error } = await supabase
      .from("weights")
      .upsert(withoutId, { onConflict: "person_id,date" });
    if (error) throw wrap(error, "salvar pesos");
    saved.push(...(data || []).map(toWeightRecord));
  }

  return saved;
}

/**
 * Saves a single entry. Falls back to updating the existing row when the
 * (person_id, date) pair already exists under a different id, which is the
 * semantic the database enforces via UNIQUE(person_id, date).
 */
export async function saveWeight(weight) {
  if (!weight || typeof weight !== "object") {
    throw new Error("saveWeight expects an object");
  }
  const supabase = await getSupabase();
  const row = toWeightRow(weight);
  const conflictTarget = row.id ? "id" : "person_id,date";

  const { data, error } = await supabase
    .from("weights")
    .upsert([row], { onConflict: conflictTarget });
  if (!error) return (data || []).map(toWeightRecord)[0] || null;

  if (!isUniqueViolation(error)) throw wrap(error, "salvar peso");

  const { data: existing, error: lookupError } = await supabase
    .from("weights")
    .select("id")
    .eq("person_id", row.person_id)
    .eq("date", row.date)
    .maybeSingle();
  if (lookupError) throw wrap(lookupError, "salvar peso");
  if (!existing) throw wrap(error, "salvar peso");

  const { data: updated, error: updateError } = await supabase
    .from("weights")
    .update({
      weight: row.weight,
      gym: row.gym,
      bike: row.bike,
      gloves: row.gloves,
      running: row.running,
      notes: row.notes,
    })
    .eq("id", existing.id)
    .select(WEIGHT_COLUMNS);
  if (updateError) throw wrap(updateError, "salvar peso");
  return (updated || []).map(toWeightRecord)[0] || null;
}

export async function deleteWeight(id) {
  if (!id) {
    throw new Error("deleteWeight expects an id");
  }
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("weights").delete().eq("id", id);
  if (error) throw wrap(error, "excluir peso");
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
