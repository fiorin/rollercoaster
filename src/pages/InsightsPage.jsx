import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useData } from "../contexts/DataContext";
import downloadFile from "../utils/download";
import { getActivityByKey } from "../utils/activities";
import {
  mergeWeights,
  normalizeImportedRecords,
  parseWeightData,
  sanitizePersonIds,
  toCSV,
} from "../utils/importExport";
import {
  addDays,
  dateKey,
  daysBetween,
  formatMonthLabel,
  formatShort,
  todayKey,
  weekStartKey,
} from "../utils/date";

function generateLocalInsights(summary) {
  if (!summary) return [];

  const insights = [];
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

  if (
    summary.activitySummary &&
    summary.activitySummary !== "No activity data yet"
  ) {
    insights.push(`🏋️ Activity log: ${summary.activitySummary}`);
  }

  const consistency = ((summary.entryCount / summary.daysTracked) * 100).toFixed(0);
  insights.push(
    `📊 Consistency: ${consistency}% (${summary.entryCount} entries in ${summary.daysTracked} days)`,
  );

  return insights;
}

function groupBy(sorted, keyOf) {
  const groups = new Map();
  for (const entry of sorted) {
    const key = keyOf(entry);
    const bucket = groups.get(key);
    if (bucket) bucket.push(entry);
    else groups.set(key, [entry]);
  }
  return groups;
}

function generateWeeklySummaries(sorted) {
  if (!sorted.length) return [];

  const weeks = [];
  for (const [weekStart, entries] of groupBy(sorted, (entry) =>
    weekStartKey(entry.date),
  )) {
    const values = entries.map((entry) => entry.kg).sort((a, b) => a - b);
    const first = entries[0].kg;
    const last = entries[entries.length - 1].kg;
    weeks.push({
      weekStart,
      weekLabel: `${formatShort(weekStart)} – ${formatShort(addDays(weekStart, 6))}`,
      first: first.toFixed(1),
      last: last.toFixed(1),
      min: values[0].toFixed(1),
      max: values[values.length - 1].toFixed(1),
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
      entries: entries.length,
      delta: (last - first).toFixed(1),
    });
  }

  return weeks.sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));
}

function generateMonthlySummaries(sorted) {
  if (!sorted.length) return [];

  const months = [];
  for (const [monthKey, entries] of groupBy(
    sorted,
    (entry) => dateKey(entry.date).slice(0, 7),
  )) {
    const values = entries.map((entry) => entry.kg).sort((a, b) => a - b);
    const first = entries[0].kg;
    const last = entries[entries.length - 1].kg;
    months.push({
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      first: first.toFixed(1),
      last: last.toFixed(1),
      min: values[0].toFixed(1),
      max: values[values.length - 1].toFixed(1),
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
      entries: entries.length,
      delta: (last - first).toFixed(1),
    });
  }

  return months.sort((a, b) => (a.monthKey < b.monthKey ? 1 : -1));
}

export default function InsightsPage() {
  const { weights, people, loading, currentUser, importWeights, toast } =
    useData();
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [connectedRecords, setConnectedRecords] = useState([]);
  const [summaryView, setSummaryView] = useState("weekly");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  // The FileReader callback runs after an await boundary. Reading the latest
  // data from a ref avoids merging with the snapshot captured when the file
  // was picked.
  const dataRef = useRef({ weights, people, currentUser });
  useEffect(() => {
    dataRef.current = { weights, people, currentUser };
  }, [weights, people, currentUser]);

  const userWeights = useMemo(() => {
    if (!currentUser) return [];
    return weights
      .filter((entry) => entry.personId === currentUser.id)
      .sort((a, b) => {
        const left = dateKey(a.date);
        const right = dateKey(b.date);
        return left < right ? -1 : left > right ? 1 : 0;
      });
  }, [weights, currentUser]);

  const summary = useMemo(() => {
    if (!userWeights.length) return null;
    const initialWeight = userWeights[0].kg;
    const currentWeight = userWeights[userWeights.length - 1].kg;
    const delta = currentWeight - initialWeight;
    const firstDate = dateKey(userWeights[0].date);
    const lastDate = dateKey(userWeights[userWeights.length - 1].date);
    const daysTracked = Math.max(daysBetween(firstDate, lastDate) + 1, 1);
    const weeklyDelta = (delta / daysTracked) * 7;
    const activityCount = {};
    for (const entry of userWeights) {
      for (const [key, value] of Object.entries(entry.activities || {})) {
        if (value) activityCount[key] = (activityCount[key] || 0) + 1;
      }
    }
    const activitySummary = Object.entries(activityCount)
      .map(
        ([key, value]) =>
          `${getActivityByKey(key)?.label || key}: ${value} days`,
      )
      .join(", ");
    return {
      entryCount: userWeights.length,
      initialWeight: initialWeight.toFixed(1),
      currentWeight: currentWeight.toFixed(1),
      changeText: `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} kg`,
      weeklyDeltaText: `${weeklyDelta >= 0 ? "+" : ""}${weeklyDelta.toFixed(2)} kg/week`,
      daysTracked,
      activitySummary: activitySummary || "No activity data yet",
    };
  }, [userWeights]);

  const insights = useMemo(() => generateLocalInsights(summary), [summary]);
  const weeklySummaries = useMemo(
    () => generateWeeklySummaries(userWeights),
    [userWeights],
  );
  const monthlySummaries = useMemo(
    () => generateMonthlySummaries(userWeights),
    [userWeights],
  );

  const onFileImport = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setImportError("");
      setImportSuccess("");
      setConnectedRecords([]);
      setImporting(true);

      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const { weights: currentWeights, people: currentPeople, currentUser: activeUser } =
            dataRef.current;
          const raw = parseWeightData(String(reader.result));
          const normalized = normalizeImportedRecords(raw, activeUser?.id);
          const validIds = new Set(currentPeople.map((person) => person.id));
          const sanitized = sanitizePersonIds(
            normalized,
            validIds,
            activeUser?.id,
          );

          if (!sanitized.length) {
            setImportError("No usable records found in the file.");
            toast("Nenhum registro utilizável no arquivo", "error");
            return;
          }

          const { records, added, updated } = mergeWeights(
            currentWeights,
            sanitized,
          );

          await importWeights(records);

          setImportSuccess(
            `Imported ${added} new and updated ${updated} existing record${
              added + updated === 1 ? "" : "s"
            }.`,
          );
          setConnectedRecords(records);
          toast(`${added + updated} registros importados`, "success");
        } catch (err) {
          setImportError(
            "Error parsing or saving file. Use the app export JSON format or a valid CSV.",
          );
          toast(err.message || "Falha na importação", "error");
        } finally {
          setImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };

      reader.readAsText(file);
    },
    [importWeights, toast],
  );

  const fileStamp = todayKey();
  const safeName = (currentUser?.name || "export").replace(/[^\w-]+/g, "_");

  const exportAsJSON = useCallback(() => {
    if (!userWeights.length) {
      toast("Nada para exportar", "error");
      return;
    }
    const data = {
      user: currentUser?.name || "Unknown",
      exportedAt: new Date().toISOString(),
      summary,
      weights: userWeights,
    };
    downloadFile(
      JSON.stringify(data, null, 2),
      `weight-data-${safeName}-${fileStamp}.json`,
      "application/json",
    );
    toast("Export JSON pronto", "success");
  }, [userWeights, currentUser, summary, safeName, fileStamp, toast]);

  const exportAsCSV = useCallback(() => {
    if (!userWeights.length) {
      toast("Nada para exportar", "error");
      return;
    }
    downloadFile(
      toCSV(userWeights),
      `weight-data-${safeName}-${fileStamp}.csv`,
      "text/csv;charset=utf-8",
    );
    toast("Export CSV pronto", "success");
  }, [userWeights, safeName, fileStamp, toast]);

  const exportAsPrompt = useCallback(() => {
    if (!userWeights.length) {
      toast("Nada para exportar", "error");
      return;
    }
    const prompt = `Here is my weight tracking data for analysis:\n\n${JSON.stringify(
      { user: currentUser?.name, summary, data: userWeights },
      null,
      2,
    )}\n\nPlease analyze this data and provide insights.`;
    downloadFile(
      prompt,
      `weight-prompt-${safeName}-${fileStamp}.txt`,
      "text/plain;charset=utf-8",
    );
    toast("Prompt pronto", "success");
  }, [userWeights, currentUser, summary, safeName, fileStamp, toast]);

  if (loading)
    return (
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    );

  return (
    <div className="page-body">
      <div className="page-title">
        <h2>Insights</h2>
      </div>
      <p className="page-description">
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
        <section className="insights-panel section-gap">
          <h3>Local insights</h3>
          <div className="insights-list">
            {insights.map((insight) => (
              <div key={insight} className="insight-card">
                {insight}
              </div>
            ))}
          </div>
        </section>
      )}

      {(weeklySummaries.length > 0 || monthlySummaries.length > 0) && (
        <section className="insights-panel section-gap">
          <h3>Weekly & Monthly reports</h3>
          <div className="export-actions">
            <button
              className={`primary ${summaryView === "weekly" ? "active-pill" : ""}`}
              onClick={() => setSummaryView("weekly")}
              type="button"
            >
              📅 Weekly
            </button>
            <button
              className={`primary ${summaryView === "monthly" ? "active-pill" : ""}`}
              onClick={() => setSummaryView("monthly")}
              type="button"
            >
              📆 Monthly
            </button>
          </div>

          <div className="report-list">
            {summaryView === "weekly"
              ? weeklySummaries.slice(0, 12).map((week) => (
                  <div key={week.weekStart} className="report-card">
                    <div className="report-card-title">
                      Week of {week.weekLabel}
                    </div>
                    <div className="report-card-grid">
                      <span>Entries: {week.entries}</span>
                      <span>Min: {week.min} kg</span>
                      <span>Max: {week.max} kg</span>
                      <span>Avg: {week.avg} kg</span>
                      <span className="report-card-wide">
                        Change: {week.delta > 0 ? "+" : ""}
                        {week.delta} kg
                      </span>
                    </div>
                  </div>
                ))
              : monthlySummaries.slice(0, 12).map((month) => (
                  <div key={month.monthKey} className="report-card">
                    <div className="report-card-title">{month.monthLabel}</div>
                    <div className="report-card-grid">
                      <span>Entries: {month.entries}</span>
                      <span>First: {month.first} kg</span>
                      <span>Last: {month.last} kg</span>
                      <span>Avg: {month.avg} kg</span>
                      <span>Min: {month.min} kg</span>
                      <span>Max: {month.max} kg</span>
                      <span className="report-card-wide">
                        Month change: {month.delta > 0 ? "+" : ""}
                        {month.delta} kg
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        </section>
      )}

      <section className="insights-panel section-gap">
        <h3>Export data</h3>
        <p className="page-description" style={{ marginBottom: "16px" }}>
          Export your data for external analysis or backup.
        </p>
        <div className="export-actions">
          <button className="primary" onClick={exportAsJSON} type="button">
            📄 JSON
          </button>
          <button className="primary" onClick={exportAsCSV} type="button">
            📊 CSV
          </button>
          <button className="primary" onClick={exportAsPrompt} type="button">
            💬 AI Prompt
          </button>
        </div>
        <p className="page-description" style={{ marginTop: "12px", fontSize: "12px" }}>
          Use the AI Prompt format to paste your data into ChatGPT, Claude, or
          any other AI for detailed analysis.
        </p>
      </section>

      <section className="insights-panel section-gap">
        <h3>Import external data</h3>
        <p className="page-description" style={{ marginBottom: "12px" }}>
          Import weight history from exported JSON or compatible CSV. Records
          that already exist for the same person and date are updated instead
          of duplicated.
        </p>
        <label className="field-label" htmlFor="import-file">
          Import file (JSON or CSV)
        </label>
        <input
          id="import-file"
          ref={fileInputRef}
          className="file-input"
          type="file"
          accept=".json,.csv"
          onChange={onFileImport}
          disabled={importing}
        />
        {importError && (
          <div className="goal-progress-text import-message-error">
            {importError}
          </div>
        )}
        {importSuccess && (
          <div className="goal-progress-text import-message-success">
            {importSuccess}
          </div>
        )}
        {connectedRecords.length > 0 && (
          <div className="goal-progress-text">
            ✅ Connected records: {connectedRecords.length}
          </div>
        )}
      </section>
    </div>
  );
}
