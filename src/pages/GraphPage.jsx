import React, { useMemo, useState, lazy, Suspense } from "react";
import { useData } from "../contexts/DataContext";
import { ACTIVITIES } from "../utils/activities";
import { toDailySeries, movingAverage } from "../utils/movingAverage";
import { dateKey, todayKey, addDays } from "../utils/date";
import ActivityButtons from "../components/ActivityButtons";

const ActivityCharts = lazy(() => import("../components/ActivityCharts"));
const MainWeightChart = lazy(() => import("../components/MainWeightChart"));
const ForecastChart = lazy(() => import("../components/ForecastChart"));

export default function GraphPage() {
  const { weightsByPerson, people, loading, currentUser } = useData();
  const [personIdOverride, setPersonIdOverride] = useState("");
  const [from, setFrom] = useState(() => addDays(todayKey(), -29));
  const [to, setTo] = useState(todayKey);
  const [showActivities, setShowActivities] = useState({
    gym: true,
    bike: true,
    boxing: true,
    run: true,
  });

  const personId = personIdOverride || currentUser?.id || people[0]?.id || "";

  function handleFromChange(value) {
    // An emptied date input must not break the range: the series would become
    // invalid and the charts would silently go blank.
    if (!value) return;
    setFrom(value);
    if (value > to) setTo(value);
  }

  function handleToChange(value) {
    if (!value) return;
    setTo(value);
    if (value < from) setFrom(value);
  }

  const filtered = useMemo(
    () => weightsByPerson.get(personId) || [],
    [weightsByPerson, personId],
  );

  const recordsByDate = useMemo(() => {
    const map = new Map();
    for (const entry of filtered) {
      map.set(dateKey(entry.date), entry);
    }
    return map;
  }, [filtered]);

  const series = useMemo(() => {
    const points = filtered.map((w) => ({ date: dateKey(w.date), kg: w.kg }));
    const daily = toDailySeries(points, from, to);
    const raw = daily.map((d) => d.kg);
    const m7 = movingAverage(daily, 7);
    const m30 = movingAverage(daily, 30);

    // Only the days that actually have a measurement. The forecast regression
    // must not see the carried-forward values, otherwise the flat tail drags
    // the slope towards zero.
    const measured = [];
    daily.forEach((day, index) => {
      if (recordsByDate.has(day.date) && day.kg != null) {
        measured.push({ x: index, y: day.kg });
      }
    });

    return { labels: daily.map((d) => d.date), raw, m7, m30, daily, measured };
  }, [filtered, from, to, recordsByDate]);

  const activityDaily = useMemo(
    () =>
      series.daily.map((day) => {
        const record = recordsByDate.get(day.date);
        return {
          date: day.date,
          kg: day.kg,
          gym: record?.activities?.gym ? 1 : 0,
          bike: record?.activities?.bike ? 1 : 0,
          boxing: record?.activities?.boxing ? 1 : 0,
          run: record?.activities?.run ? 1 : 0,
        };
      }),
    [series.daily, recordsByDate],
  );

  const activityCharts = useMemo(
    () =>
      ACTIVITIES.map((activity) => {
        const data = activityDaily.map((day) => day[activity.key]);
        const count = data.reduce((sum, value) => sum + value, 0);
        return { ...activity, data, count };
      }).filter((activity) => activity.count > 0),
    [activityDaily],
  );

  const activityValues = useMemo(() => {
    const values = {};
    for (const activity of Object.keys(showActivities)) {
      if (!showActivities[activity]) continue;
      values[activity] = activityDaily.map((day) =>
        day[activity] ? day.kg : null,
      );
    }
    return values;
  }, [showActivities, activityDaily]);

  const chartData = useMemo(
    () =>
      series.labels
        .map((date, index) => ({
          date,
          weight: series.raw[index],
          avg7: series.m7[index],
          avg30: series.m30[index],
          gym: activityValues.gym?.[index] ?? null,
          bike: activityValues.bike?.[index] ?? null,
          boxing: activityValues.boxing?.[index] ?? null,
          run: activityValues.run?.[index] ?? null,
        }))
        .filter((item) => item.weight !== null),
    [series, activityValues],
  );

  if (loading)
    return (
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    );

  return (
    <div className="graph-container">
      <div className="graph-header">
        <h2>Weight Graph</h2>
      </div>

      <div className="filters">
        {people.length > 1 && (
          <div className="form-field">
            <span className="field-label">Person</span>
            <select
              className="form-control"
              value={personId}
              onChange={(event) => setPersonIdOverride(event.target.value)}
            >
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="date-range-inputs">
          <label className="inline-field">
            <span className="field-label">From</span>
            <input
              className="form-control"
              type="date"
              value={from}
              max={to}
              onChange={(event) => handleFromChange(event.target.value)}
            />
          </label>
          <label className="inline-field">
            <span className="field-label">To</span>
            <input
              className="form-control"
              type="date"
              value={to}
              min={from}
              onChange={(event) => handleToChange(event.target.value)}
            />
          </label>
        </div>
        <div className="date-range-presets">
          {[
            { label: "7d", days: 7 },
            { label: "30d", days: 30 },
            { label: "90d", days: 90 },
            { label: "1a", days: 365 },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="chip"
              onClick={() => {
                // Both bounds are anchored to today, otherwise a custom "To"
                // date would silently stretch the window.
                const end = todayKey();
                setFrom(addDays(end, -(preset.days - 1)));
                setTo(end);
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="activities-section">
        <div className="field-label activity-filter-heading">
          Activity filters
        </div>
        <ActivityButtons
          activities={showActivities}
          onChange={(next) => setShowActivities(next)}
        />
      </div>

      <div className="chart">
        <Suspense
          fallback={
            <div className="spinner-container">
              <div className="spinner" />
            </div>
          }
        >
          <MainWeightChart
            chartData={chartData}
            showActivities={showActivities}
          />
        </Suspense>
      </div>

      <div className="chart chart-forecast">
        <Suspense
          fallback={
            <div className="spinner-container">
              <div className="spinner" />
            </div>
          }
        >
          <ForecastChart series={series} />
        </Suspense>
      </div>

      <div className="activity-chart-section">
        <div className="activity-chart-header">
          <h3>Activity charts</h3>
          <p>
            Each chart shows days when the selected activity was logged. Only
            tracked activities appear here.
          </p>
        </div>

        {activityCharts.length === 0 ? (
          <div className="empty-state-card">
            <p>No activity chart data available yet.</p>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="spinner-container">
                <div className="spinner" />
              </div>
            }
          >
            <ActivityCharts activityCharts={activityCharts} series={series} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
