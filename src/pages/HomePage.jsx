import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../contexts/DataContext";
import dayjs from "dayjs";

const activities = [
  { key: "gym", label: "Gym", icon: "💪" },
  { key: "bike", label: "Bike", icon: "🚴" },
  { key: "boxing", label: "Boxing", icon: "🥊" },
  { key: "run", label: "Running", icon: "🏃" },
];

function formatDelta(delta) {
  if (delta === null || delta === undefined) return "-";
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(2)} kg`;
}

function getAverageForDays(sorted, days) {
  if (!sorted.length) return null;
  const recent = sorted.slice(-days);
  return recent.reduce((sum, w) => sum + w.kg, 0) / recent.length;
}

function getFilledAverageWeight(sorted, days) {
  if (!sorted.length) return null;
  const latest = dayjs(sorted[sorted.length - 1].date);
  const start = latest.subtract(days - 1, "day");
  const weightByDate = new Map(
    sorted.map((w) => [dayjs(w.date).format("YYYY-MM-DD"), w.kg]),
  );
  let lastKg = sorted[0].kg;
  const firstDate = dayjs(sorted[0].date);

  if (firstDate.isAfter(start)) {
    lastKg = sorted[0].kg;
  }

  let sum = 0;
  for (let i = 0; i < days; i += 1) {
    const currentDate = start.add(i, "day");
    const key = currentDate.format("YYYY-MM-DD");
    if (weightByDate.has(key)) {
      lastKg = weightByDate.get(key);
    }
    sum += lastKg;
  }

  return sum / days;
}

function getActivityDaysInPeriod(sorted, key, days) {
  if (!sorted.length) return 0;
  const recent = sorted.slice(-days);
  return recent.filter((w) => w.activities?.[key]).length;
}

export default function HomePage({ currentUser }) {
  const { weights, loading } = useData();

  const userWeights = useMemo(() => {
    if (!currentUser) return [];
    return weights.filter((w) => w.personId === currentUser.id);
  }, [weights, currentUser]);

  const sortedWeights = useMemo(
    () => [...userWeights].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [userWeights],
  );

  const summary = useMemo(() => {
    const count = sortedWeights.length;
    if (!count) return null;

    const latest = sortedWeights[count - 1];
    const oldest = sortedWeights[0];
    const initialWeight = oldest.kg;
    const currentWeight = latest.kg;
    const totalDelta = currentWeight - initialWeight;

    const avg30 = getFilledAverageWeight(sortedWeights, 30);
    const avg7 = getFilledAverageWeight(sortedWeights, 7);

    const startDate = dayjs(oldest.date).format("MMM D, YYYY");

    return {
      count,
      currentWeight: currentWeight.toFixed(1),
      initialWeight: initialWeight.toFixed(1),
      totalDelta: totalDelta.toFixed(2),
      avg30: avg30 ? avg30.toFixed(1) : "-",
      avg7: avg7 ? avg7.toFixed(1) : "-",
      startDate,
    };
  }, [sortedWeights]);

  const activityStats = useMemo(() => {
    if (!sortedWeights.length) return [];

    const daysSinceStart =
      sortedWeights.length > 0
        ? dayjs(sortedWeights[sortedWeights.length - 1].date).diff(
            sortedWeights[0].date,
            "day",
          ) + 1
        : 0;
    const weeksSinceStart = Math.max(daysSinceStart / 7, 1);

    return activities
      .map((activity) => {
        const totalDays = sortedWeights.filter(
          (w) => w.activities?.[activity.key],
        ).length;
        const last3Days = getActivityDaysInPeriod(
          sortedWeights,
          activity.key,
          3,
        );
        const last7Days = getActivityDaysInPeriod(
          sortedWeights,
          activity.key,
          7,
        );
        const avgPerWeek = (totalDays / weeksSinceStart).toFixed(1);

        if (totalDays === 0) return null;

        return {
          ...activity,
          totalDays,
          avgPerWeek,
          last3Days,
          last7Days,
        };
      })
      .filter(Boolean);
  }, [sortedWeights]);

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="page-header">
        <h2>Home</h2>
        <p>Track progress, streaks, and activity performance.</p>
      </div>

      {!currentUser ? (
        <div className="empty-state-card">
          <p>
            Select a user from the top-right avatar to see activity summaries.
          </p>
        </div>
      ) : !summary ? (
        <div className="empty-state-card">
          <p>
            No weight records yet. Add your first entry to start tracking
            progress.
          </p>
        </div>
      ) : (
        <>
          <div className="summary-section">
            <div className="section-header">
              <h3>Weight Summary</h3>
              <small className="start-date">{summary.startDate}</small>
            </div>
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-card-label">Starting Weight</div>
                <div className="summary-card-value">
                  {summary.initialWeight} kg
                </div>
                <div className="summary-card-subtext">
                  {formatDelta(Number(summary.totalDelta))}
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-card-label">Current Weight</div>
                <div className="summary-card-value">
                  {summary.currentWeight} kg
                </div>
                <div className="summary-card-subtext">
                  Started {summary.startDate}
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-card-label">Last 7 Days Avg</div>
                <div className="summary-card-value">{summary.avg7} kg</div>
                <div className="summary-card-subtext">Last week</div>
              </div>
              <div className="summary-card">
                <div className="summary-card-label">Last 30 Days Avg</div>
                <div className="summary-card-value">{summary.avg30} kg</div>
                <div className="summary-card-subtext">Last month</div>
              </div>
            </div>
          </div>

          {activityStats.length > 0 && (
            <div className="activity-stats-section">
              <div className="section-header">
                <h3>Tracked Activities</h3>
              </div>
              <div className="activity-stats-grid">
                {activityStats.map((activity) => (
                  <div key={activity.key} className="activity-stat-card">
                    <div className="activity-stat-header">
                      <span className="activity-stat-icon">
                        {activity.icon}
                      </span>
                      <h4>{activity.label}</h4>
                    </div>
                    <div className="activity-stat-metrics">
                      <div className="metric">
                        <span>Per Week</span>
                        <strong>{activity.avgPerWeek}</strong>
                      </div>
                      <div className="metric">
                        <span>Last 3 Days</span>
                        <strong>{activity.last3Days}</strong>
                      </div>
                      <div className="metric">
                        <span>Last 7 Days</span>
                        <strong>{activity.last7Days}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
