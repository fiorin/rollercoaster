import { describe, expect, it } from "vitest";
import { activityDaysInWindow, filledAverage } from "../utils/summary";

function mapOf(entries) {
  return new Map(entries);
}

describe("filledAverage", () => {
  it("carries the most recent weight forward inside the window", () => {
    const weights = mapOf([
      ["2024-01-08", 90],
      ["2024-01-10", 92],
    ]);

    // 7 days ending on Jan 10: Jan 8 is carried for Jan 8-9, Jan 10 is 92.
    const result = filledAverage(weights, 7, "2024-01-10");
    expect(result).toBeCloseTo((90 * 2 + 92) / 3, 5);
  });

  it("seeds with the last known weight before the window", () => {
    // The user weighed 100 kg a month ago and stopped after dropping to 90.
    const weights = mapOf([
      ["2023-12-01", 100],
      ["2023-12-02", 90],
    ]);

    // The bug used the oldest value (100) instead of the latest (90).
    expect(filledAverage(weights, 7, "2024-01-10")).toBe(90);
  });

  it("returns null when there is no weight to carry", () => {
    expect(filledAverage(mapOf([]), 7, "2024-01-10")).toBeNull();
  });

  it("averages only from the first entry when nothing precedes the window", () => {
    const weights = mapOf([
      ["2024-01-10", 80],
      ["2024-01-12", 82],
    ]);

    // Window Jan 4..10 has a single measured day.
    expect(filledAverage(weights, 7, "2024-01-10")).toBe(80);
  });
});

describe("activityDaysInWindow", () => {
  const entries = [
    { date: "2024-01-01", activities: { gym: true } },
    { date: "2024-01-08", activities: { gym: true, bike: true } },
    { date: "2024-01-10", activities: { gym: true } },
  ];

  it("counts only entries inside the window", () => {
    expect(activityDaysInWindow(entries, "gym", 3, "2024-01-10")).toBe(2);
    expect(activityDaysInWindow(entries, "gym", 7, "2024-01-10")).toBe(2);
    expect(activityDaysInWindow(entries, "gym", 10, "2024-01-10")).toBe(3);
  });

  it("ignores activities that are not logged", () => {
    expect(activityDaysInWindow(entries, "run", 7, "2024-01-10")).toBe(0);
    expect(activityDaysInWindow([], "gym", 7, "2024-01-10")).toBe(0);
  });
});
