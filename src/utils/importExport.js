import { dateKey } from "./date";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseBool(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value !== "string") return false;
  return /^(true|yes|y|1)$/i.test(value.trim());
}

export function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

export function entryKey(record) {
  return `${record.personId}|${dateKey(record.date)}`;
}

/**
 * Maps an arbitrary imported record onto the app shape.
 * Returns null when the record cannot be used.
 */
export function normalizeWeightRecord(record, fallbackPersonId) {
  if (!record || typeof record !== "object") return null;

  const kgValue =
    record.kg ??
    record.weight ??
    record["weight (kg)"] ??
    record.weight_kg ??
    record["weight_kg"];
  const parsedKg =
    typeof kgValue === "string"
      ? parseFloat(kgValue.replace(",", "."))
      : kgValue;
  const date = record.date || record.Date;
  const personId = record.personId || record.person_id || fallbackPersonId;
  if (
    !date ||
    parsedKg === null ||
    parsedKg === undefined ||
    Number.isNaN(Number(parsedKg)) ||
    !personId
  )
    return null;

  return {
    // Only keep ids that the database will accept (uuid); anything else is
    // regenerated so the insert cannot fail on an invalid primary key.
    id: isUuid(record.id) ? record.id.trim() : undefined,
    date: dateKey(date),
    kg: Number(parsedKg),
    personId,
    notes: record.notes || "",
    activities: {
      gym: parseBool(record.activities?.gym ?? record.gym),
      bike: parseBool(record.activities?.bike ?? record.bike),
      boxing: parseBool(
        record.activities?.boxing ??
          record.activities?.gloves ??
          record.boxing ??
          record.gloves,
      ),
      run: parseBool(
        record.activities?.run ??
          record.activities?.running ??
          record.run ??
          record.running,
      ),
    },
  };
}

export function normalizeImportedRecords(rawRecords, fallbackPersonId) {
  return rawRecords
    .map((item) => normalizeWeightRecord(item, fallbackPersonId))
    .filter(Boolean);
}

/** Parses a JSON or CSV payload into a flat list of raw records. */
export function parseWeightData(fileText) {
  try {
    const parsed = JSON.parse(fileText);
    if (Array.isArray(parsed)) return parsed;
    if (parsed?.weights && Array.isArray(parsed.weights)) return parsed.weights;
    if (parsed?.data && Array.isArray(parsed.data)) return parsed.data;
    if (parsed && typeof parsed === "object") return [parsed];
    return [];
  } catch {
    const rows = fileText
      .trim()
      .split(/\r?\n/)
      .filter((row) => row.trim().length > 0)
      .map((row) => row.split(","));
    const headers = rows[0]?.map((header) => header.trim().toLowerCase());
    if (!headers) return [];
    return rows.slice(1).map((row) => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index]?.trim();
      });
      return item;
    });
  }
}

/**
 * Merges imported records with what is already stored, keyed by
 * (person, date) — the same key the database enforces as UNIQUE.
 *
 * When a date already exists, the stored id is reused so the upsert updates
 * the row instead of colliding with the unique constraint.
 */
export function mergeWeights(existing, imported) {
  const existingByKey = new Map();
  for (const entry of existing) {
    existingByKey.set(entryKey(entry), entry);
  }

  const mergedByKey = new Map();
  for (const item of imported) {
    const key = entryKey(item);
    const match = existingByKey.get(key);
    mergedByKey.set(key, match ? { ...item, id: match.id } : item);
  }

  let added = 0;
  let updated = 0;
  for (const key of mergedByKey.keys()) {
    if (existingByKey.has(key)) updated += 1;
    else added += 1;
  }

  return {
    records: Array.from(mergedByKey.values()),
    added,
    updated,
  };
}

/** Drops records pointing at people that no longer exist. */
export function sanitizePersonIds(records, validPersonIds, fallbackPersonId) {
  const valid = validPersonIds instanceof Set ? validPersonIds : new Set(validPersonIds);
  return records.map((record) => {
    if (valid.has(record.personId)) return record;
    if (!fallbackPersonId) return null;
    return { ...record, personId: fallbackPersonId, id: undefined };
  }).filter(Boolean);
}

function escapeCsvField(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCSV(records) {
  const headers = [
    "Date",
    "Weight (kg)",
    "Gym",
    "Bike",
    "Boxing",
    "Running",
    "Notes",
  ];
  const rows = records.map((record) => [
    dateKey(record.date),
    record.kg,
    record.activities?.gym ? "Yes" : "No",
    record.activities?.bike ? "Yes" : "No",
    record.activities?.boxing ? "Yes" : "No",
    record.activities?.run ? "Yes" : "No",
    record.notes || "",
  ]);
  return [headers, ...rows]
    .map((row) => row.map(escapeCsvField).join(","))
    .join("\n");
}
