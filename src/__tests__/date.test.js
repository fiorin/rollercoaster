import { describe, it, expect } from "vitest";
import {
  addDays,
  addMonths,
  byDateAsc,
  byDateDesc,
  dateKey,
  daysBetween,
  daysInMonth,
  dayOfWeek,
  formatLong,
  formatMedium,
  formatMonthLabel,
  formatMonthYear,
  formatShort,
  isWithinDays,
  monthDayKey,
  monthOf,
  parseDateKey,
  startOfMonthKey,
  weekStartKey,
  yearOf,
} from "../utils/date";

describe("dateKey", () => {
  it("keeps a plain calendar key untouched", () => {
    expect(dateKey("2024-01-15")).toBe("2024-01-15");
  });

  it("normalizes other inputs to a calendar key", () => {
    expect(dateKey("15/01/2024")).toBe("2024-01-15");
    expect(dateKey("15-01-2024")).toBe("2024-01-15");
    expect(dateKey("2024-01-15T12:00:00.000Z")).toBe("2024-01-15");
  });

  it("returns an empty string for empty input", () => {
    expect(dateKey("")).toBe("");
    expect(dateKey(null)).toBe("");
  });
});

describe("parseDateKey", () => {
  it("parses as local midnight, not UTC midnight", () => {
    const parsed = parseDateKey("2024-01-15");
    expect(parsed.getFullYear()).toBe(2024);
    expect(parsed.getMonth()).toBe(0);
    expect(parsed.getDate()).toBe(15);
    expect(parsed.getHours()).toBe(0);
    expect(parsed.getMinutes()).toBe(0);
  });

  it("returns an invalid date for an unusable key", () => {
    expect(Number.isNaN(parseDateKey("").getTime())).toBe(true);
  });
});

describe("yearOf / monthOf", () => {
  it("uses pure string math so it never shifts across timezones", () => {
    expect(yearOf("2024-01-01")).toBe(2024);
    expect(monthOf("2024-01-01")).toBe(1);
    expect(yearOf("2024-12-31")).toBe(2024);
    expect(monthOf("2024-12-31")).toBe(12);
  });
});

describe("addDays / daysBetween", () => {
  it("crosses month boundaries", () => {
    expect(addDays("2024-01-31", 1)).toBe("2024-02-01");
    expect(addDays("2024-03-01", -1)).toBe("2024-02-29");
  });

  it("counts whole calendar days", () => {
    expect(daysBetween("2024-01-01", "2024-01-08")).toBe(7);
    expect(daysBetween("2024-01-08", "2024-01-01")).toBe(-7);
  });
});

describe("isWithinDays", () => {
  const end = "2024-03-10";

  it("includes the end day and the days before it", () => {
    expect(isWithinDays("2024-03-10", end, 7)).toBe(true);
    expect(isWithinDays("2024-03-04", end, 7)).toBe(true);
    expect(isWithinDays("2024-03-03", end, 7)).toBe(false);
    expect(isWithinDays("2024-03-11", end, 7)).toBe(false);
  });

  it("handles a single day window", () => {
    expect(isWithinDays(end, end, 1)).toBe(true);
    expect(isWithinDays("2024-03-09", end, 1)).toBe(false);
  });
});

describe("weekStartKey", () => {
  it("returns the Monday of the week", () => {
    expect(weekStartKey("2024-01-17")).toBe("2024-01-15");
    expect(weekStartKey("2024-01-15")).toBe("2024-01-15");
    expect(weekStartKey("2024-01-21")).toBe("2024-01-15");
  });

  it("treats Sunday as the end of the week", () => {
    expect(weekStartKey("2024-01-21")).toBe("2024-01-15");
  });
});

describe("addMonths", () => {
  it("keeps the day when the target month is long enough", () => {
    expect(addMonths("2024-01-15", 1)).toBe("2024-02-15");
    expect(addMonths("2024-01-15", -1)).toBe("2023-12-15");
  });

  it("clamps the day to the length of the target month", () => {
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");
    expect(addMonths("2023-01-31", 1)).toBe("2023-02-28");
  });
});

describe("month helpers", () => {
  it("counts the days of the month", () => {
    expect(daysInMonth("2024-02-10")).toBe(29);
    expect(daysInMonth("2023-02-10")).toBe(28);
    expect(daysInMonth("2024-12-01")).toBe(31);
  });

  it("returns the first day of the month", () => {
    expect(startOfMonthKey("2024-02-19")).toBe("2024-02-01");
  });

  it("builds a key for a day inside the month", () => {
    expect(monthDayKey("2024-02-19", 7)).toBe("2024-02-07");
  });

  it("returns the weekday, Sunday first", () => {
    expect(dayOfWeek("2024-01-21")).toBe(0);
    expect(dayOfWeek("2024-01-15")).toBe(1);
  });
});

describe("formatters", () => {
  it("formats dates in English without timezone drift", () => {
    expect(formatShort("2024-01-15")).toBe("Jan 15");
    expect(formatMedium("2024-01-15")).toBe("Jan 15, 2024");
    expect(formatLong("2024-01-15")).toBe("15 Jan 2024");
    expect(formatMonthYear("2024-01-15")).toBe("January 2024");
  });

  it("formats a year-month label", () => {
    expect(formatMonthLabel("2024-01")).toBe("Jan 2024");
    expect(formatMonthLabel("2024-12")).toBe("Dec 2024");
    expect(formatMonthLabel("nope")).toBe("");
  });
});

describe("sort comparators", () => {
  const entries = [{ date: "2024-01-02" }, { date: "2024-01-01" }];

  it("sorts ascending and descending by calendar key", () => {
    expect([...entries].sort(byDateAsc)[0].date).toBe("2024-01-01");
    expect([...entries].sort(byDateDesc)[0].date).toBe("2024-01-02");
  });
});
