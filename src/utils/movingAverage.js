import { addDays, dateKey } from "./date";

/**
 * Expands sparse weight entries into a contiguous daily series, carrying the
 * last known weight forward on days without an entry.
 */
export function toDailySeries(weights, from, to) {
  const map = new Map();
  for (const weight of weights) {
    map.set(dateKey(weight.date), weight.kg);
  }

  const days = [];
  const end = dateKey(to);
  let cursor = dateKey(from);
  let last = null;

  // An empty/invalid bound would make the loop spin forever, because addDays
  // keeps returning an empty string for it.
  if (!cursor || !end || cursor > end) return days;

  while (cursor <= end) {
    if (map.has(cursor)) last = map.get(cursor);
    days.push({ date: cursor, kg: last });
    cursor = addDays(cursor, 1);
  }
  return days;
}

/**
 * Rolling average over a calendar window.
 *
 * Implemented with a moving start pointer so the whole series is processed in
 * O(n) instead of O(n*window) — the previous version re-parsed every date
 * with a date library on every iteration, which cost ~130k allocations for a
 * one-year chart.
 */
export function movingAverage(series, windowDays) {
  const out = [];
  if (!series.length) return out;

  const size = Math.max(1, Math.floor(windowDays) || 1);
  const keys = series.map((item) => dateKey(item.date));
  let sum = 0;
  let count = 0;
  let start = 0;

  for (let i = 0; i < series.length; i += 1) {
    const cutoff = addDays(keys[i], -(size - 1));

    while (start < i && keys[start] < cutoff) {
      const expired = series[start].kg;
      if (expired != null) {
        sum -= expired;
        count -= 1;
      }
      start += 1;
    }

    const value = series[i].kg;
    if (value != null) {
      sum += value;
      count += 1;
    }

    out.push(count ? +(sum / count).toFixed(2) : null);
  }

  return out;
}
