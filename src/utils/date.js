export const DATE_KEY_FORMAT = "YYYY-MM-DD";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_FIRST_RE = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
const ISO_PREFIX_RE = /^(\d{4}-\d{2}-\d{2})[T ]/;

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MS_PER_DAY = 86400000;

function formatKey(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function fromDate(date) {
  return formatKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * Normalizes any date-ish value to a "YYYY-MM-DD" calendar key.
 *
 * The `weights.date` column is a Postgres `date`, which PostgREST returns as a
 * plain "YYYY-MM-DD" string. That string is a *calendar* date with no timezone,
 * so it must never be fed to `new Date()` (which parses it as UTC midnight and
 * silently shifts it to the previous day in negative UTC offsets).
 */
export function dateKey(value) {
  if (!value) return "";

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return fromDate(value);
  }

  if (typeof value === "number") {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return fromDate(date);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (DATE_KEY_RE.test(trimmed)) return trimmed;

    // An ISO timestamp: the leading calendar date is the day the entry
    // belongs to, no timezone conversion involved.
    const iso = ISO_PREFIX_RE.exec(trimmed);
    if (iso) return iso[1];

    // Day-first formats are common in Brazilian exports ("15/01/2024").
    const dayFirst = DAY_FIRST_RE.exec(trimmed);
    if (dayFirst) {
      const [, day, month, year] = dayFirst;
      return formatKey(year, month, day);
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return "";
    return fromDate(parsed);
  }

  return "";
}

/** Parses a calendar key as local midnight. Never use `new Date(key)`. */
export function parseDateKey(key) {
  const normalized = dateKey(key);
  if (!normalized) return new Date(NaN);
  const [year, month, day] = normalized.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Calendar year of a date key. Pure string math, no timezone involved. */
export function yearOf(value) {
  return Number(dateKey(value).slice(0, 4));
}

/** Calendar month of a date key, 1-12. Pure string math, no timezone involved. */
export function monthOf(value) {
  return Number(dateKey(value).slice(5, 7));
}

export function todayKey() {
  return fromDate(new Date());
}

export function addDays(key, days) {
  const date = parseDateKey(key);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return fromDate(date);
}

/** Adds calendar months, clamping the day to the length of the target month. */
export function addMonths(key, months) {
  const date = parseDateKey(key);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const maxDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  target.setDate(Math.min(day, maxDay));
  return fromDate(target);
}

/** Whole days between two calendar keys (b - a). */
export function daysBetween(a, b) {
  const start = parseDateKey(a);
  const end = parseDateKey(b);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  // Local midnights are 23h/25h apart across a DST boundary, so round.
  return Math.round((end - start) / MS_PER_DAY);
}

/** Number of days in the month of the given key. */
export function daysInMonth(key) {
  const date = parseDateKey(key);
  if (Number.isNaN(date.getTime())) return 0;
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** First day of the month of the given key. */
export function startOfMonthKey(key) {
  const date = parseDateKey(key);
  if (Number.isNaN(date.getTime())) return "";
  return formatKey(date.getFullYear(), date.getMonth() + 1, 1);
}

/** The key for a given day inside the month of the given key. */
export function monthDayKey(key, day) {
  const date = parseDateKey(key);
  if (Number.isNaN(date.getTime())) return "";
  return formatKey(date.getFullYear(), date.getMonth() + 1, day);
}

/** Day of the week, 0 = Sunday. */
export function dayOfWeek(key) {
  const date = parseDateKey(key);
  if (Number.isNaN(date.getTime())) return 0;
  return date.getDay();
}

/** True when `key` falls within the `days` calendar days ending at `endKey`. */
export function isWithinDays(key, endKey, days) {
  const start = addDays(endKey, -(days - 1));
  const normalized = dateKey(key);
  return normalized >= start && normalized <= endKey;
}

/** Monday of the week containing `key`, as "YYYY-MM-DD". */
export function weekStartKey(key) {
  const date = parseDateKey(key);
  if (Number.isNaN(date.getTime())) return "";
  const weekday = date.getDay(); // 0 = Sunday
  const offset = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + offset);
  return fromDate(date);
}

/** "2024-01-15" -> "Jan 15" */
export function formatShort(key) {
  const date = parseDateKey(key);
  if (Number.isNaN(date.getTime())) return "";
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
}

/** "2024-01-15" -> "Jan 15, 2024" */
export function formatMedium(key) {
  const date = parseDateKey(key);
  if (Number.isNaN(date.getTime())) return "";
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** "2024-01-15" -> "15 Jan 2024" */
export function formatLong(key) {
  const date = parseDateKey(key);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/** "2024-01-15" -> "January 2024" */
export function formatMonthYear(key) {
  const date = parseDateKey(key);
  if (Number.isNaN(date.getTime())) return "";
  return `${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

/** "2024-01" -> "Jan 2024" */
export function formatMonthLabel(yearMonth) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(yearMonth || ""));
  if (!match) return "";
  return `${MONTHS_SHORT[Number(match[2]) - 1]} ${match[1]}`;
}

/** Sort comparator for calendar keys, ascending. */
export function byDateAsc(a, b) {
  const left = dateKey(a.date ?? a);
  const right = dateKey(b.date ?? b);
  return left < right ? -1 : left > right ? 1 : 0;
}

/** Sort comparator for calendar keys, descending. */
export function byDateDesc(a, b) {
  const left = dateKey(a.date ?? a);
  const right = dateKey(b.date ?? b);
  return left > right ? -1 : left < right ? 1 : 0;
}
