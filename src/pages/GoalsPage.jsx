import React, { useCallback, useEffect, useMemo, useState } from "react";
import { uid } from "../utils/storage";
import { useData } from "../contexts/DataContext";
import { dateKey, formatMedium, todayKey } from "../utils/date";
import { GOALS_KEY, loadGoals, saveGoals } from "../utils/goals";

function computeProgress(current, start, target) {
  if (
    typeof current !== "number" ||
    typeof start !== "number" ||
    typeof target !== "number"
  ) {
    return 0;
  }
  if (target === start) return 100;
  if (target < start) {
    const total = start - target;
    const completed = Math.min(Math.max(start - current, 0), total);
    return Math.round((completed / total) * 100);
  }
  const total = target - start;
  const completed = Math.min(Math.max(current - start, 0), total);
  return Math.round((completed / total) * 100);
}

/**
 * Local day of a goal creation timestamp.
 *
 * New goals store a plain "YYYY-MM-DD" key. Older ones stored a full UTC ISO
 * timestamp, whose leading date can be the previous/next local day, so it is
 * converted through the local parser instead of being sliced.
 */
function goalDateKey(createdAt) {
  if (!createdAt) return todayKey();
  return createdAt.length > 10
    ? dateKey(new Date(createdAt))
    : dateKey(createdAt);
}

function formatKg(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value.toFixed(1)} kg`
    : "—";
}

/**
 * Weight of the most recent entry on or before `referenceDate`.
 * Used as the baseline of a goal: progress must be measured from the moment
 * the goal was created, not from the very first entry ever logged.
 */
function weightAtDate(sorted, referenceDate) {
  const cutoff = goalDateKey(referenceDate);
  let found = null;
  for (const entry of sorted) {
    if (dateKey(entry.date) <= cutoff) found = entry.kg;
    else break;
  }
  if (found != null) return found;
  return sorted.length ? sorted[0].kg : null;
}

export default function GoalsPage() {
  const { weightsByPerson, currentUser } = useData();
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState("");
  const [targetKg, setTargetKg] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setGoals(loadGoals());
  }, []);

  // Keep goals in sync when another tab creates or removes one.
  useEffect(() => {
    function handleStorage(event) {
      if (event.key === GOALS_KEY) setGoals(loadGoals());
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const sortedWeights = useMemo(() => {
    if (!currentUser) return [];
    const list = weightsByPerson.get(currentUser.id) || [];
    return [...list].sort((a, b) => {
      const left = dateKey(a.date);
      const right = dateKey(b.date);
      return left < right ? -1 : left > right ? 1 : 0;
    });
  }, [weightsByPerson, currentUser]);

  const currentWeight = useMemo(() => {
    if (!sortedWeights.length) return null;
    return sortedWeights[sortedWeights.length - 1].kg;
  }, [sortedWeights]);

  const startWeight = useMemo(() => {
    if (!sortedWeights.length) return null;
    return sortedWeights[0].kg;
  }, [sortedWeights]);

  const userGoals = useMemo(
    () => goals.filter((goal) => goal.personId === currentUser?.id),
    [goals, currentUser],
  );

  const addGoal = useCallback(
    (event) => {
      event.preventDefault();
      if (!currentUser) return;

      if (!title.trim()) {
        setFormError("Give the goal a name.");
        return;
      }
      const numericTarget = Number(targetKg);
      if (!targetKg || !Number.isFinite(numericTarget) || numericTarget <= 0) {
        setFormError("Enter a valid target weight.");
        return;
      }
      if (!targetDate) {
        setFormError("Pick a target date.");
        return;
      }

      const next = [
        ...goals,
        {
          id: uid(),
          personId: currentUser.id,
          title: title.trim(),
          targetKg: numericTarget,
          targetDate,
          createdAt: todayKey(),
        },
      ];
      setGoals(saveGoals(next));
      setTitle("");
      setTargetKg("");
      setTargetDate("");
      setFormError("");
    },
    [currentUser, goals, targetKg, targetDate, title],
  );

  const removeGoal = useCallback(
    (goalId) => {
      setGoals(saveGoals(goals.filter((goal) => goal.id !== goalId)));
    },
    [goals],
  );

  return (
    <div className="page-body">
      <div className="page-title">
        <h2>Goals</h2>
      </div>
      <p className="page-description">
        Create weight targets and track progress with badges when you hit them.
      </p>

      {!currentUser ? (
        <div className="empty-state-card">
          <p>Please select a user to manage goals.</p>
        </div>
      ) : (
        <>
          <form className="goals-form card" onSubmit={addGoal}>
            <div className="form-field">
              <label className="field-label" htmlFor="goal-title">
                Goal name
              </label>
              <input
                id="goal-title"
                className="form-control"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (formError) setFormError("");
                }}
                placeholder="Lose 3 kg by summer"
              />
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="goal-target">
                Target weight (kg)
              </label>
              <input
                id="goal-target"
                className="form-control"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                value={targetKg}
                onChange={(event) => {
                  setTargetKg(event.target.value);
                  if (formError) setFormError("");
                }}
              />
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="goal-date">
                Target date
              </label>
              <input
                id="goal-date"
                className="form-control"
                type="date"
                value={targetDate}
                min={todayKey()}
                onChange={(event) => {
                  setTargetDate(event.target.value);
                  if (formError) setFormError("");
                }}
              />
            </div>
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <div className="form-actions">
              <button className="primary" type="submit">
                Save goal
              </button>
            </div>
          </form>

          <div className="goal-summary-card">
            <strong>Current weight</strong>
            <div>
              {currentWeight != null
                ? `${currentWeight.toFixed(1)} kg`
                : "No weights yet"}
            </div>
            <strong>Start weight</strong>
            <div>
              {startWeight != null ? `${startWeight.toFixed(1)} kg` : "No weights yet"}
            </div>
          </div>

          {userGoals.length === 0 ? (
            <div className="empty-state-card">
              <p>No goals set. Add one to start tracking progress.</p>
            </div>
          ) : (
            <div className="goal-list">
              {userGoals.map((goal) => {
                const baseline =
                  weightAtDate(sortedWeights, goal.createdAt) ?? startWeight;
                const progress = computeProgress(
                  currentWeight,
                  baseline,
                  goal.targetKg,
                );
                // Derived from the bar so the badge and the percentage can
                // never disagree.
                const achieved = currentWeight !== null && progress >= 100;
                return (
                  <div key={goal.id} className="goal-card">
                    <div className="goal-card-header">
                      <div>
                        <strong>{goal.title}</strong>
                        <div className="goal-meta">
                          Target: {formatKg(goal.targetKg)} by{" "}
                          {formatMedium(goal.targetDate)}
                        </div>
                        <div className="goal-meta">
                          Started from {baseline != null ? formatKg(baseline) : "—"}
                        </div>
                      </div>
                      <div
                        className={`goal-badge ${achieved ? "goal-badge-success" : ""}`}
                      >
                        {achieved ? "Achieved" : "Active"}
                      </div>
                    </div>
                    <div className="goal-progress-bar">
                      <div
                        className="goal-progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="goal-progress-text">
                      {progress}% complete{achieved ? " • Badge earned" : ""}
                    </div>
                    <button
                      type="button"
                      aria-label={`Remover meta ${goal.title}`}
                      onClick={() => removeGoal(goal.id)}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
