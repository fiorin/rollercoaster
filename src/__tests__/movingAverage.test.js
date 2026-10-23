import { describe, it, expect } from "vitest";
import { movingAverage, toDailySeries } from "../utils/movingAverage";
import { addDays } from "../utils/date";

describe("toDailySeries", () => {
  it("fills the gaps with the last known weight", () => {
    const series = toDailySeries(
      [
        { date: "2024-01-01", kg: 80 },
        { date: "2024-01-03", kg: 78 },
      ],
      "2024-01-01",
      "2024-01-04",
    );
    expect(series.map((d) => d.kg)).toEqual([80, 80, 78, 78]);
  });

  it("returns null before the first known weight", () => {
    const series = toDailySeries(
      [{ date: "2024-01-02", kg: 80 }],
      "2024-01-01",
      "2024-01-03",
    );
    expect(series[0].kg).toBeNull();
  });

  it("handles an empty range", () => {
    expect(toDailySeries([], "2024-01-01", "2024-01-01")).toHaveLength(1);
  });

  it("does not loop forever on an empty or inverted range", () => {
    // An emptied <input type="date"> used to freeze the tab here.
    expect(toDailySeries([], "", "2024-01-03")).toEqual([]);
    expect(toDailySeries([], "2024-01-01", "")).toEqual([]);
    expect(toDailySeries([], "2024-01-05", "2024-01-01")).toEqual([]);
  });
});

describe("movingAverage", () => {
  it("returns an empty array for an empty series", () => {
    expect(movingAverage([], 7)).toEqual([]);
  });

  it("treats an invalid window as a single day", () => {
    const series = [
      { date: "2024-01-01", kg: 100 },
      { date: "2024-01-02", kg: 102 },
    ];
    expect(movingAverage(series, 0)).toEqual([100, 102]);
    expect(movingAverage(series, -3)).toEqual([100, 102]);
  });

  it("averages the trailing window", () => {
    const series = [
      { date: "2024-01-01", kg: 100 },
      { date: "2024-01-02", kg: 101 },
      { date: "2024-01-03", kg: 102 },
    ];
    expect(movingAverage(series, 3)).toEqual([100, 100.5, 101]);
  });

  it("drops values that fall out of the window", () => {
    const series = [
      { date: "2024-01-01", kg: 100 },
      { date: "2024-01-02", kg: 102 },
      { date: "2024-01-03", kg: 104 },
      { date: "2024-01-04", kg: 106 },
    ];
    // window of 2: each value only averages with the previous day
    expect(movingAverage(series, 2)).toEqual([100, 101, 103, 105]);
  });

  it("ignores null weights when averaging", () => {
    const series = [
      { date: "2024-01-01", kg: 100 },
      { date: "2024-01-02", kg: null },
      { date: "2024-01-03", kg: 102 },
    ];
    expect(movingAverage(series, 3)).toEqual([100, 100, 101]);
  });

  it("matches a naive reference implementation", () => {
    const series = Array.from({ length: 60 }, (_, index) => ({
      date: addDays("2024-01-01", index),
      kg: 70 + (index % 7),
    }));

    const window = 14;
    const result = movingAverage(series, window);

    const naive = series.map((_, index) => {
      const slice = series
        .slice(Math.max(0, index - window + 1), index + 1)
        .map((d) => d.kg)
        .filter((kg) => kg != null);
      if (!slice.length) return null;
      return +(slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(2);
    });

    expect(result).toEqual(naive);
  });
});
