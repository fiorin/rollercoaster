import React, {
  useEffect,
  useState,
  useMemo,
  lazy,
  Suspense,
  useCallback,
} from "react";
import { saveWeights } from "../utils/storage";
import { useData } from "../contexts/DataContext";
import WeightList from "../components/WeightList";

const WeightModal = lazy(() => import("../components/WeightModal"));

const monthOptions = [
  { value: "all", label: "All months" },
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
];

export default function WeightsPage({ currentUser }) {
  const { weights, people, loading, updateWeights } = useData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");

  // Filter weights to show only current user's weights
  const userWeights = useMemo(() => {
    if (!currentUser) return [];
    return weights.filter((w) => w.personId === currentUser.id);
  }, [weights, currentUser]);

  const yearOptions = useMemo(() => {
    const years = [
      ...new Set(userWeights.map((w) => new Date(w.date).getFullYear())),
    ];
    return years
      .sort((a, b) => b - a)
      .map((year) => ({
        value: String(year),
        label: String(year),
      }));
  }, [userWeights]);

  React.useEffect(() => {
    if (yearOptions.length && !selectedYear) {
      setSelectedYear(yearOptions[0].value);
    }
  }, [yearOptions, selectedYear]);

  const filteredWeights = useMemo(() => {
    let next = userWeights;
    if (selectedYear) {
      next = next.filter(
        (w) => new Date(w.date).getFullYear().toString() === selectedYear,
      );
    }
    if (selectedMonth !== "all") {
      next = next.filter(
        (w) =>
          String(new Date(w.date).getMonth() + 1).padStart(2, "0") ===
          selectedMonth,
      );
    }
    return next;
  }, [userWeights, selectedYear, selectedMonth]);

  const addOrUpdate = useCallback(
    async (w) => {
      let next;
      if (w.id) {
        next = weights.map((x) => (x.id === w.id ? w : x));
      } else {
        w.id = Date.now().toString(36);
        next = [...weights, w];
      }
      updateWeights(next);
      try {
        await saveWeights(next);
      } catch (err) {
        console.error("Error saving weights", err);
      }
    },
    [weights, updateWeights],
  );

  const del = useCallback(
    async (id) => {
      const next = weights.filter((w) => w.id !== id);
      updateWeights(next);
      try {
        await saveWeights(next);
      } catch (err) {
        console.error("Error deleting weight", err);
      }
    },
    [weights, updateWeights],
  );

  if (loading)
    return (
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    );

  return (
    <div className="weights-container">
      <div className="weights-header">
        <h2>Weight Entries</h2>
        {currentUser ? (
          <p className="weights-info">{currentUser.name}</p>
        ) : (
          <p className="weights-info">Select a user to view their weights</p>
        )}
      </div>

      <div className="weights-content">
        {currentUser ? (
          <>
            <div className="weights-filters">
              <div className="form-field weights-filter">
                <span className="field-label">Year</span>
                <select
                  className="form-control"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {yearOptions.map((year) => (
                    <option key={year.value} value={year.value}>
                      {year.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field weights-filter">
                <span className="field-label">Month</span>
                <select
                  className="form-control"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {filteredWeights.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "var(--text-secondary)",
                }}
              >
                <p style={{ fontSize: "16px", margin: "0 0 8px 0" }}>
                  No weight entries found for this period
                </p>
                <p style={{ fontSize: "14px", margin: 0 }}>
                  Use the year and month filters to narrow your data.
                </p>
              </div>
            ) : (
              <WeightList
                weights={filteredWeights}
                people={people}
                onEdit={(w) => {
                  setEditing(w);
                  setOpen(true);
                }}
                onDelete={del}
              />
            )}
          </>
        ) : (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              color: "var(--text-secondary)",
            }}
          >
            <p>
              👤 Please select a user from the top right to view their weights
            </p>
          </div>
        )}
      </div>

      {currentUser && (
        <button
          className="add-weight-fab"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          title="Add new weight entry"
        >
          ➕
        </button>
      )}

      {open && (
        <Suspense
          fallback={
            <div className="spinner-container">
              <div className="spinner" />
            </div>
          }
        >
          <WeightModal
            open={open}
            onClose={() => setOpen(false)}
            onSave={addOrUpdate}
            initial={editing}
            people={people}
            currentUser={currentUser}
          />
        </Suspense>
      )}
    </div>
  );
}
