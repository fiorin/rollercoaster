import { describe, it, expect } from "vitest";
import {
  entryKey,
  isUuid,
  mergeWeights,
  normalizeImportedRecords,
  normalizeWeightRecord,
  parseBool,
  parseWeightData,
  sanitizePersonIds,
  toCSV,
} from "../utils/importExport";

const PERSON = "3f5c8b1e-9a2d-4c7f-8b1e-2a9d4c7f8b1e";
const OTHER_PERSON = "9a2d4c7f-8b1e-4c7f-8b1e-3f5c8b1e9a2d";

describe("parseBool", () => {
  it("accepts the common truthy spellings", () => {
    expect(parseBool(true)).toBe(true);
    expect(parseBool("true")).toBe(true);
    expect(parseBool("Yes")).toBe(true);
    expect(parseBool("1")).toBe(true);
    expect(parseBool(1)).toBe(true);
  });

  it("treats everything else as false", () => {
    expect(parseBool(false)).toBe(false);
    expect(parseBool("false")).toBe(false);
    expect(parseBool("")).toBe(false);
    expect(parseBool(undefined)).toBe(false);
  });
});

describe("isUuid", () => {
  it("accepts a v4 uuid and rejects junk", () => {
    expect(isUuid(PERSON)).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("")).toBe(false);
    expect(isUuid(null)).toBe(false);
  });
});

describe("normalizeWeightRecord", () => {
  it("accepts the several weight column spellings", () => {
    expect(normalizeWeightRecord({ date: "2024-01-15", kg: 80 }, PERSON).kg).toBe(80);
    expect(
      normalizeWeightRecord({ date: "2024-01-15", weight: 80 }, PERSON).kg,
    ).toBe(80);
    expect(
      normalizeWeightRecord({ date: "2024-01-15", "weight (kg)": 80 }, PERSON).kg,
    ).toBe(80);
  });

  it("parses comma decimals", () => {
    expect(
      normalizeWeightRecord({ date: "2024-01-15", weight: "80,5" }, PERSON).kg,
    ).toBe(80.5);
  });

  it("drops the id when it is not a valid uuid", () => {
    expect(
      normalizeWeightRecord({ id: "abc", date: "2024-01-15", kg: 80 }, PERSON).id,
    ).toBeUndefined();
  });

  it("keeps a valid uuid", () => {
    expect(
      normalizeWeightRecord({ id: PERSON, date: "2024-01-15", kg: 80 }, PERSON).id,
    ).toBe(PERSON);
  });

  it("returns null for unusable records", () => {
    expect(normalizeWeightRecord(null, PERSON)).toBeNull();
    expect(normalizeWeightRecord({ date: "2024-01-15" }, PERSON)).toBeNull();
    expect(normalizeWeightRecord({ kg: 80 }, PERSON)).toBeNull();
    expect(normalizeWeightRecord({ date: "2024-01-15", kg: 80 }, null)).toBeNull();
  });

  it("maps the legacy activity column names", () => {
    const record = normalizeWeightRecord(
      { date: "2024-01-15", kg: 80, gloves: "Yes", running: "Yes" },
      PERSON,
    );
    expect(record.activities.boxing).toBe(true);
    expect(record.activities.run).toBe(true);
    expect(record.activities.gym).toBe(false);
  });
});

describe("parseWeightData", () => {
  it("parses a JSON array", () => {
    expect(parseWeightData('[{"date":"2024-01-15"}]')).toHaveLength(1);
  });

  it("parses a JSON object with a weights key", () => {
    expect(parseWeightData('{"weights":[{"date":"2024-01-15"}]}')).toHaveLength(1);
  });

  it("falls back to CSV parsing", () => {
    const rows = parseWeightData("Date,Weight (kg)\n2024-01-15,80");
    expect(rows).toEqual([{ date: "2024-01-15", "weight (kg)": "80" }]);
  });

  it("returns an empty list for empty input", () => {
    expect(parseWeightData("")).toEqual([]);
  });
});

describe("mergeWeights", () => {
  const existing = [
    { id: "id-1", personId: PERSON, date: "2024-01-15", kg: 80 },
    { id: "id-2", personId: PERSON, date: "2024-01-16", kg: 79 },
  ];

  it("counts new and updated rows separately", () => {
    const imported = [
      { personId: PERSON, date: "2024-01-15", kg: 81 },
      { personId: PERSON, date: "2024-01-17", kg: 78 },
    ];
    const result = mergeWeights(existing, imported);
    expect(result.added).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.records).toHaveLength(2);
  });

  it("reuses the stored id when the date already exists", () => {
    const result = mergeWeights(existing, [
      { id: "different", personId: PERSON, date: "2024-01-15", kg: 81 },
    ]);
    expect(result.records[0].id).toBe("id-1");
    expect(result.records[0].kg).toBe(81);
  });

  it("dedupes by person and date, not by id", () => {
    const result = mergeWeights(existing, [
      { id: "x", personId: PERSON, date: "2024-01-15", kg: 81 },
      { id: "y", personId: PERSON, date: "2024-01-15", kg: 82 },
    ]);
    expect(result.records).toHaveLength(1);
  });

  it("keeps different people apart", () => {
    const result = mergeWeights(existing, [
      { personId: OTHER_PERSON, date: "2024-01-15", kg: 70 },
    ]);
    expect(result.records).toHaveLength(1);
    expect(result.added).toBe(1);
    expect(result.updated).toBe(0);
  });
});

describe("sanitizePersonIds", () => {
  it("drops records of people that no longer exist", () => {
    const records = [
      { personId: PERSON, date: "2024-01-15", kg: 80 },
      { personId: OTHER_PERSON, date: "2024-01-16", kg: 70 },
    ];
    const result = sanitizePersonIds(records, [PERSON], null);
    expect(result).toHaveLength(1);
    expect(result[0].personId).toBe(PERSON);
  });

  it("reassigns to the fallback person and clears the id", () => {
    const records = [
      { id: "old", personId: OTHER_PERSON, date: "2024-01-16", kg: 70 },
    ];
    const result = sanitizePersonIds(records, [PERSON], PERSON);
    expect(result[0].personId).toBe(PERSON);
    expect(result[0].id).toBeUndefined();
  });
});

describe("toCSV", () => {
  it("writes a header and one row per record", () => {
    const csv = toCSV([
      { date: "2024-01-15", kg: 80, activities: { gym: true } },
    ]);
    expect(csv.split("\n")).toHaveLength(2);
    expect(csv).toContain("Date,Weight (kg),Gym,Bike,Boxing,Running,Notes");
    expect(csv).toContain("2024-01-15,80,Yes,No,No,No,");
  });

  it("escapes commas and quotes in fields", () => {
    const csv = toCSV([
      { date: "2024-01-15", kg: 80, notes: 'a,b "c"' },
    ]);
    expect(csv).toContain('"a,b ""c"""');
  });

  it("round-trips through the importer", () => {
    const csv = toCSV([
      { date: "2024-01-15", kg: 80, activities: { gym: true }, notes: "ok" },
    ]);
    const parsed = parseWeightData(csv);
    const records = normalizeImportedRecords(parsed, PERSON);
    expect(records).toHaveLength(1);
    expect(records[0].kg).toBe(80);
    expect(records[0].activities.gym).toBe(true);
    expect(records[0].notes).toBe("ok");
  });
});

describe("normalizeImportedRecords", () => {
  it("removes unusable records and normalizes the rest", () => {
    const records = normalizeImportedRecords(
      [{ date: "2024-01-15", kg: 80 }, { nope: true }],
      PERSON,
    );
    expect(records).toHaveLength(1);
    expect(records[0].personId).toBe(PERSON);
    expect(records[0].date).toBe("2024-01-15");
  });
});

describe("entryKey", () => {
  it("combines person and date", () => {
    expect(entryKey({ personId: PERSON, date: "2024-01-15" })).toBe(
      `${PERSON}|2024-01-15`,
    );
  });
});
