import React, { useMemo } from "react";
import { useData } from "../contexts/DataContext";
import { ACTIVITIES } from "../utils/activities";
import { addDays, dateKey, daysBetween, todayKey } from "../utils/date";
import { activityDaysInWindow, filledAverage } from "../utils/summary";

function formatDelta(delta) {
  if (delta === null || delta === undefined) return "-";
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(2)} kg`;
}

export default function HomePage() {
  const { weightsByPerson, currentUser, people, loading } = useData();

  const userWeights = useMemo(() => {
    if (!currentUser) return [];
    return weightsByPerson.get(currentUser.id) || [];
  }, [weightsByPerson, currentUser]);

  const sortedWeights = useMemo(
    () =>
      [...userWeights].sort((a, b) => {
        const left = dateKey(a.date);
        const right = dateKey(b.date);
        return left < right ? -1 : left > right ? 1 : 0;
      }),
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

    const weightByDate = new Map(
      sortedWeights.map((w) => [dateKey(w.date), w.kg]),
    );

    const today = todayKey();
    const avg30 = filledAverage(weightByDate, 30, today);
    const avg7 = filledAverage(weightByDate, 7, today);

    return {
      count,
      currentWeight: currentWeight.toFixed(1),
      initialWeight: initialWeight.toFixed(1),
      totalDelta: totalDelta.toFixed(2),
      avg30: avg30 != null ? avg30.toFixed(1) : "-",
      avg7: avg7 != null ? avg7.toFixed(1) : "-",
      avg7Range: `${addDays(today, -6)} → ${today}`,
      avg30Range: `${addDays(today, -29)} → ${today}`,
      startDate: dateKey(oldest.date),
    };
  }, [sortedWeights]);

  const activityStats = useMemo(() => {
    if (!sortedWeights.length) return [];

    const firstDate = dateKey(sortedWeights[0].date);
    const today = todayKey();
    // The rate is per week since tracking started, not since the last entry:
    // someone who logged three days and stopped two months ago did not train
    // 3 times a week for the whole period.
    const daysSinceStart = Math.max(daysBetween(firstDate, today) + 1, 1);
    const weeksSinceStart = Math.max(daysSinceStart / 7, 1);

    return ACTIVITIES.map((activity) => {
      const totalDays = sortedWeights.filter(
        (w) => w.activities?.[activity.key],
      ).length;
      const last3Days = activityDaysInWindow(
        sortedWeights,
        activity.key,
        3,
        today,
      );
      const last7Days = activityDaysInWindow(
        sortedWeights,
        activity.key,
        7,
        today,
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
    }).filter(Boolean);
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
            {people.length === 0
              ? "No users yet. Create one in Manage Users to start tracking."
              : "Select a user from the top-right avatar to see activity summaries."}
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
                <div className="summary-card-subtext">{summary.avg7Range}</div>
              </div>
              <div className="summary-card">
                <div className="summary-card-label">Last 30 Days Avg</div>
                <div className="summary-card-value">{summary.avg30} kg</div>
                <div className="summary-card-subtext">
                  {summary.avg30Range}
                </div>
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
