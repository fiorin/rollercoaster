import React, { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { useData } from "../contexts/DataContext";
import { ACTIVITIES } from "../utils/activities";
import { toDailySeries, movingAverage } from "../utils/movingAverage";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
} from "recharts";
import dayjs from "dayjs";
import ActivityButtons from "../components/ActivityButtons";

const ActivityCharts = lazy(() => import("../components/ActivityCharts"));
const MainWeightChart = lazy(() => import("../components/MainWeightChart"));
const ForecastChart = lazy(() => import("../components/ForecastChart"));

export default function GraphPage({ currentUser }) {
  const { weights, people, loading } = useData();
  const [personId, setPersonId] = useState("");
  const [from, setFrom] = useState(
    dayjs().subtract(30, "day").format("YYYY-MM-DD"),
  );
  const [to, setTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [showActivities, setShowActivities] = useState({
    gym: true,
    bike: true,
    boxing: true,
    run: true,
  });

  useEffect(() => {
    if (currentUser) {
      setPersonId(currentUser.id);
    } else if (people[0] && !personId) {
      setPersonId(people[0].id);
    }
  }, [people, currentUser]);

  const filtered = useMemo(
    () => weights.filter((w) => w.personId === personId),
    [weights, personId],
  );

  const series = useMemo(() => {
    const pts = filtered.map((w) => ({ date: w.date.slice(0, 10), kg: w.kg }));
    const daily = toDailySeries(pts, from, to);
    const raw = daily.map((d) => d.kg);
    const m7 = movingAverage(daily, 7);
    const m30 = movingAverage(daily, 30);
    return { labels: daily.map((d) => d.date), raw, m7, m30, daily };
  }, [filtered, from, to]);

  const activityDaily = useMemo(() => {
    return series.daily.map((day, index) => {
      const record = filtered.find((w) => w.date.slice(0, 10) === day.date);
      return {
        date: day.date,
        gym: record?.activities?.gym ? 1 : 0,
        bike: record?.activities?.bike ? 1 : 0,
        boxing: record?.activities?.boxing ? 1 : 0,
        run: record?.activities?.run ? 1 : 0,
        kg: day.kg,
      };
    });
  }, [series.daily, filtered]);

  const activityCharts = useMemo(() => {
    return ACTIVITIES.map((activity) => {
      const data = activityDaily.map((day) => day[activity.key]);
      const count = data.reduce((sum, value) => sum + value, 0);
      return { ...activity, data, count };
    }).filter((activity) => activity.count > 0);
  }, [activityDaily]);

  const activityDatasets = useMemo(() => {
    const activityColorMap = {
      gym: "#FBC02D",
      bike: "#4CAF50",
      boxing: "#F44336",
      run: "#2196F3",
    };

    return Object.entries(showActivities).reduce(
      (datasets, [activity, show]) => {
        if (!show) return datasets;
        const activityData = activityDaily.map((day) =>
          day[activity] ? day.kg : null,
        );
        return [
          ...datasets,
          {
            label: activity.charAt(0).toUpperCase() + activity.slice(1),
            data: activityData,
            borderColor: activityColorMap[activity],
            backgroundColor: activityColorMap[activity],
            borderWidth: 0,
            pointRadius: 6,
            pointStyle: "rectRounded",
            pointBackgroundColor: activityColorMap[activity],
            pointBorderColor: "var(--bg-white)",
            pointBorderWidth: 2,
            showLine: false,
            tension: 0,
          },
        ];
      },
      [],
    );
  }, [showActivities, activityDaily]);

  const activityValues = useMemo(
    () =>
      activityDatasets.reduce((memo, dataset) => {
        memo[dataset.label.toLowerCase()] = dataset.data;
        return memo;
      }, {}),
    [activityDatasets],
  );

  const chartData = useMemo(() => {
    return series.labels
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
      .filter((item) => item.weight !== null);
  }, [series, activityValues]);

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
        {!currentUser && (
          <div className="form-field">
            <span className="field-label">Person</span>
            <select
              className="form-control"
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
            >
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
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
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="inline-field">
            <span className="field-label">To</span>
            <input
              className="form-control"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
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
