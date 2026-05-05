import dayjs from "dayjs";

export function toDailySeries(weights, from, to) {
  // weights: array of {date, kg}
  const map = new Map();
  weights.forEach((w) => map.set(w.date.slice(0, 10), w.kg));
  const days = [];
  let cur = dayjs(from);
  const end = dayjs(to);
  let last = null;
  while (cur.isBefore(end) || cur.isSame(end, "day")) {
    const d = cur.format("YYYY-MM-DD");
    if (map.has(d)) last = map.get(d);
    days.push({ date: d, kg: last });
    cur = cur.add(1, "day");
  }
  return days;
}

export function movingAverage(series, windowDays) {
  // series: [{date, kg}] chronological
  const out = [];
  for (let i = 0; i < series.length; i++) {
    const end = dayjs(series[i].date);
    const start = end.subtract(windowDays - 1, "day");
    let sum = 0,
      cnt = 0;
    for (let j = 0; j <= i; j++) {
      const d = dayjs(series[j].date);
      if (d.isBefore(start)) continue;
      const v = series[j].kg;
      if (v != null) {
        sum += v;
        cnt++;
      }
    }
    out.push(cnt ? +(sum / cnt).toFixed(2) : null);
  }
  return out;
}
