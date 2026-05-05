import React, { useCallback, useMemo, useState } from "react";
import { useData } from "../contexts/DataContext";
import dayjs from "dayjs";

function parseWeightData(fileText) {
  try {
    const parsed = JSON.parse(fileText);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    const rows = fileText
      .trim()
      .split(/\r?\n/)
      .map((row) => row.split(","));
    const headers = rows[0]?.map((h) => h.trim().toLowerCase());
    if (!headers) return [];
    return rows.slice(1).map((row) => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index]?.trim();
      });
      return item;
    });
  }
  return [];
}

function generateLocalInsights(summary, userWeights) {
  if (!summary) return [];

  const insights = [];

  // Trend insight
  const delta = parseFloat(summary.changeText);
  if (delta > 0) {
    insights.push(
      `📈 Weight trend: +${delta.toFixed(1)} kg over ${summary.daysTracked} days (${summary.weeklyDeltaText})`,
    );
  } else if (delta < 0) {
    insights.push(
      `📉 Weight trend: ${delta.toFixed(1)} kg over ${summary.daysTracked} days (${summary.weeklyDeltaText})`,
    );
  } else {
    insights.push(
      `⚖️ Weight stable: ${delta.toFixed(1)} kg change over ${summary.daysTracked} days`,
    );
  }

  // Weekly pace
  const weeklyDelta = parseFloat(summary.weeklyDeltaText);
  if (Math.abs(weeklyDelta) < 0.2) {
    insights.push(
      `🎯 Very stable pace (${summary.weeklyDeltaText}/week) - maintain current activity level`,
    );
  } else if (Math.abs(weeklyDelta) <= 0.4) {
    insights.push(
      `✅ Healthy pace (${summary.weeklyDeltaText}/week) - this is sustainable`,
    );
  } else if (weeklyDelta > 0) {
    insights.push(
      `⚠️ Gaining ${weeklyDelta.toFixed(2)} kg/week - consider adjusting intake or activity`,
    );
  } else {
    insights.push(
      `⚠️ Losing ${Math.abs(weeklyDelta).toFixed(2)} kg/week - ensure you're not losing too fast`,
    );
  }

  // Activity summary
  if (
    summary.activitySummary &&
    summary.activitySummary !== "No activity data yet"
  ) {
    insights.push(`🏋️ Activity log: ${summary.activitySummary}`);
  }

  // Entry consistency
  const consistency = (
    (summary.entryCount / summary.daysTracked) *
    100
  ).toFixed(0);
  insights.push(
    `📊 Consistency: ${consistency}% (${summary.entryCount} entries in ${summary.daysTracked} days)`,
  );

  return insights;
}

function generateWeeklySummaries(userWeights) {
  if (!userWeights.length) return [];

  const sorted = [...userWeights].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );

  const weekMap = new Map();
  sorted.forEach((w) => {
    const weekStart = dayjs(w.date).startOf("week").format("YYYY-MM-DD");
    if (!weekMap.has(weekStart)) {
      weekMap.set(weekStart, []);
    }
    weekMap.get(weekStart).push(w);
  });

  const weeks = Array.from(weekMap.entries())
    .map(([weekStart, entries]) => {
      const weights = entries.map((e) => e.kg).sort((a, b) => a - b);
      const min = weights[0];
      const max = weights[weights.length - 1];
      const avg = (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(
        1,
      );
      return {
        weekStart,
        weekEnd: dayjs(weekStart).add(6, "day").format("MMM DD"),
        min: min.toFixed(1),
        max: max.toFixed(1),
        avg,
        entries: entries.length,
        delta: (max - min).toFixed(1),
      };
    })
    .sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart));

  return weeks;
}

function generateMonthlySummaries(userWeights) {
  if (!userWeights.length) return [];

  const sorted = [...userWeights].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );

  const monthMap = new Map();
  sorted.forEach((w) => {
    const monthKey = dayjs(w.date).format("YYYY-MM");
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, []);
    }
    monthMap.get(monthKey).push(w);
  });

  const months = Array.from(monthMap.entries())
    .map(([monthKey, entries]) => {
      const weights = entries.map((e) => e.kg).sort((a, b) => a - b);
      const first = entries[0].kg;
      const last = entries[entries.length - 1].kg;
      const min = weights[0];
      const max = weights[weights.length - 1];
      const avg = (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(
        1,
      );
      return {
        monthKey,
        month: dayjs(monthKey).format("MMM YYYY"),
        min: min.toFixed(1),
        max: max.toFixed(1),
        avg,
        first: first.toFixed(1),
        last: last.toFixed(1),
        entries: entries.length,
        delta: (last - first).toFixed(1),
      };
    })
    .sort((a, b) => new Date(b.monthKey) - new Date(a.monthKey));

  return months;
}

export default function InsightsPage({ currentUser }) {
  const { weights, people, loading } = useData();
  const [importError, setImportError] = useState("");
  const [connectedRecords, setConnectedRecords] = useState([]);
  const [summaryView, setSummaryView] = useState("weekly");

  const userWeights = useMemo(() => {
    if (!currentUser) return [];
    return weights.filter((w) => w.personId === currentUser.id);
  }, [currentUser, weights]);

  const summary = useMemo(() => {
    const sorted = [...userWeights].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    if (!sorted.length) return null;
    const initialWeight = sorted[0].kg;
    const currentWeight = sorted[sorted.length - 1].kg;
    const delta = currentWeight - initialWeight;
    const firstDate = dayjs(sorted[0].date);
    const lastDate = dayjs(sorted[sorted.length - 1].date);
    const daysTracked = lastDate.diff(firstDate, "day") + 1;
    const weeklyDelta = daysTracked > 0 ? (delta / daysTracked) * 7 : 0;
    const activityCount = sorted.reduce((memo, entry) => {
      Object.entries(entry.activities || {}).forEach(([key, value]) => {
        if (value) memo[key] = (memo[key] || 0) + 1;
      });
      return memo;
    }, {});
    const activitySummary = Object.entries(activityCount)
      .map(([key, value]) => `${key}: ${value} days`)
      .join(", ");
    return {
      entryCount: sorted.length,
      initialWeight: initialWeight.toFixed(1),
      currentWeight: currentWeight.toFixed(1),
      changeText: `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} kg`,
      weeklyDeltaText: `${weeklyDelta >= 0 ? "+" : ""}${weeklyDelta.toFixed(2)} kg/week`,
      daysTracked,
      activitySummary: activitySummary || "No activity data yet",
    };
  }, [userWeights]);

  const insights = useMemo(
    () => generateLocalInsights(summary, userWeights),
    [summary, userWeights],
  );

  const weeklySummaries = useMemo(
    () => generateWeeklySummaries(userWeights),
    [userWeights],
  );

  const monthlySummaries = useMemo(
    () => generateMonthlySummaries(userWeights),
    [userWeights],
  );

  const onFileImport = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result;
        const imported = parseWeightData(text);
        if (!imported.length) {
          setImportError("No usable records found in the file.");
          setConnectedRecords([]);
          return;
        }
        setImportError("");
        setConnectedRecords(imported);
      } catch (err) {
        setImportError("Error parsing file. Use JSON or CSV.");
        setConnectedRecords([]);
      }
    };
    reader.readAsText(file);
  }, []);

  const exportAsJSON = useCallback(() => {
    if (!userWeights.length) {
      alert("No data to export");
      return;
    }
    const data = {
      user: currentUser?.name || "Unknown",
      exportedAt: new Date().toISOString(),
      summary,
      weights: userWeights,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `weight-data-${currentUser?.name || "export"}-${dayjs().format("YYYY-MM-DD")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [userWeights, currentUser, summary]);

  const exportAsCSV = useCallback(() => {
    if (!userWeights.length) {
      alert("No data to export");
      return;
    }
    const headers = ["Date", "Weight (kg)", "Gym", "Bike", "Boxing", "Running"];
    const rows = userWeights.map((w) => [
      w.date,
      w.kg,
      w.activities?.gym ? "Yes" : "No",
      w.activities?.bike ? "Yes" : "No",
      w.activities?.boxing ? "Yes" : "No",
      w.activities?.run ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `weight-data-${currentUser?.name || "export"}-${dayjs().format("YYYY-MM-DD")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [userWeights, currentUser]);

  const exportAsPrompt = useCallback(() => {
    if (!userWeights.length) {
      alert("No data to export");
      return;
    }
    const prompt = `Here is my weight tracking data for analysis:\n\n${JSON.stringify(
      {
        user: currentUser?.name,
        summary,
        data: userWeights,
      },
      null,
      2,
    )}\n\nPlease analyze this data and provide insights.`;
    const blob = new Blob([prompt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `weight-prompt-${currentUser?.name || "export"}-${dayjs().format("YYYY-MM-DD")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [userWeights, currentUser, summary]);

  if (loading)
    return (
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    );

  return (
    <div style={{ padding: "16px" }}>
      <h2>Insights</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
        View your progress and export data for deeper analysis.
      </p>

      <section className="insights-panel">
        <div className="insights-grid">
          <div className="insights-card">
            <strong>Selected user</strong>
            <div>{currentUser?.name || "Select a user"}</div>
          </div>
          <div className="insights-card">
            <strong>Entries</strong>
            <div>{summary?.entryCount ?? 0}</div>
          </div>
          <div className="insights-card">
            <strong>Trend</strong>
            <div>{summary?.changeText ?? "N/A"}</div>
          </div>
          <div className="insights-card">
            <strong>Weekly pace</strong>
            <div>{summary?.weeklyDeltaText ?? "N/A"}</div>
          </div>
        </div>
      </section>

      {insights.length > 0 && (
        <section className="insights-panel" style={{ marginTop: "24px" }}>
          <h3>Local insights</h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {insights.map((insight, idx) => (
              <div
                key={idx}
                style={{
                  padding: "12px",
                  backgroundColor: "var(--bg-secondary)",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              >
                {insight}
              </div>
            ))}
          </div>
        </section>
      )}

      {(weeklySummaries.length > 0 || monthlySummaries.length > 0) && (
        <section className="insights-panel" style={{ marginTop: "24px" }}>
          <h3>Weekly & Monthly reports</h3>
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <button
              onClick={() => setSummaryView("weekly")}
              style={{
                padding: "8px 16px",
                backgroundColor:
                  summaryView === "weekly"
                    ? "var(--primary)"
                    : "var(--bg-secondary)",
                color: summaryView === "weekly" ? "white" : "var(--text)",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              📅 Weekly
            </button>
            <button
              onClick={() => setSummaryView("monthly")}
              style={{
                padding: "8px 16px",
                backgroundColor:
                  summaryView === "monthly"
                    ? "var(--primary)"
                    : "var(--bg-secondary)",
                color: summaryView === "monthly" ? "white" : "var(--text)",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              📆 Monthly
            </button>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {summaryView === "weekly"
              ? weeklySummaries.slice(0, 12).map((week) => (
                  <div
                    key={week.weekStart}
                    style={{
                      padding: "12px",
                      backgroundColor: "var(--bg-secondary)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  >
                    <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
                      Week of {dayjs(week.weekStart).format("MMM DD")} -{" "}
                      {week.weekEnd}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                      }}
                    >
                      <span>Entries: {week.entries}</span>
                      <span>Min: {week.min} kg</span>
                      <span>Max: {week.max} kg</span>
                      <span>Avg: {week.avg} kg</span>
                      <span colSpan={2}>
                        Change: {week.delta > 0 ? "+" : ""}
                        {week.delta} kg
                      </span>
                    </div>
                  </div>
                ))
              : monthlySummaries.slice(0, 12).map((month) => (
                  <div
                    key={month.monthKey}
                    style={{
                      padding: "12px",
                      backgroundColor: "var(--bg-secondary)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  >
                    <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
                      {month.month}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                      }}
                    >
                      <span>Entries: {month.entries}</span>
                      <span>First: {month.first} kg</span>
                      <span>Last: {month.last} kg</span>
                      <span>Avg: {month.avg} kg</span>
                      <span>Min: {month.min} kg</span>
                      <span>Max: {month.max} kg</span>
                      <span colSpan={2}>
                        Month change: {month.delta > 0 ? "+" : ""}
                        {month.delta} kg
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        </section>
      )}

      <section className="insights-panel" style={{ marginTop: "24px" }}>
        <h3>Export data</h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
          Export your data for external analysis or backup.
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            className="primary"
            onClick={exportAsJSON}
            style={{ flex: "1", minWidth: "120px" }}
          >
            📄 JSON
          </button>
          <button
            className="primary"
            onClick={exportAsCSV}
            style={{ flex: "1", minWidth: "120px" }}
          >
            📊 CSV
          </button>
          <button
            className="primary"
            onClick={exportAsPrompt}
            style={{ flex: "1", minWidth: "120px" }}
          >
            💬 AI Prompt
          </button>
        </div>
        <p
          style={{
            color: "var(--text-secondary)",
            marginTop: "12px",
            fontSize: "12px",
          }}
        >
          Use the AI Prompt format to paste your data into ChatGPT, Claude, or
          any other AI for detailed analysis.
        </p>
      </section>

      <section className="insights-panel" style={{ marginTop: "24px" }}>
        <h3>Import external data</h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>
          Import weight history from other apps (JSON or CSV).
        </p>
        <input type="file" accept=".json,.csv" onChange={onFileImport} />
        {importError && (
          <div style={{ color: "var(--danger)", marginTop: "12px" }}>
            {importError}
          </div>
        )}
        {connectedRecords.length > 0 && (
          <div style={{ marginTop: "12px" }}>
            ✅ Connected records: {connectedRecords.length}
          </div>
        )}
      </section>
    </div>
  );
}
