import { addDays, dateKey } from "./date";

/**
 * Averages the last `days` calendar days, carrying the most recent known
 * weight forward on days without an entry (standard "filled" trend line).
 */
export function filledAverage(weightByDate, days, endKey) {
  const startKey = addDays(endKey, -(days - 1));

  // Seed with the most recent weight known *before* the window starts, not
  // with the oldest entry overall — otherwise the headline shows a stale
  // value for anyone who stopped logging.
  let carried = null;
  for (const [key, kg] of weightByDate) {
    if (key > startKey) break;
    carried = kg;
  }

  let sum = 0;
  let count = 0;
  for (let i = 0; i < days; i += 1) {
    const key = addDays(startKey, i);
    if (weightByDate.has(key)) carried = weightByDate.get(key);
    if (carried == null) continue;
    sum += carried;
    count += 1;
  }
  return count ? sum / count : null;
}

/** Counts entries with the activity inside the last `days` calendar days. */
export function activityDaysInWindow(sorted, activityKey, days, endKey) {
  if (!sorted.length) return 0;
  const startKey = addDays(endKey, -(days - 1));
  let count = 0;
  for (const entry of sorted) {
    const key = dateKey(entry.date);
    if (key < startKey) continue;
    if (key > endKey) continue;
    if (entry.activities?.[activityKey]) count += 1;
  }
  return count;
}
