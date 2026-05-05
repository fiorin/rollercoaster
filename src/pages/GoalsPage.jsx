import React, { useCallback, useEffect, useMemo, useState } from "react";
import { saveWeights, uid, loadWeights } from "../utils/storage";
import { useData } from "../contexts/DataContext";

const GOALS_KEY = "weight_goals";

function loadGoals() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(GOALS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveGoals(goals) {
  if (typeof window === "undefined") return goals;
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  return goals;
}

function computeProgress(current, start, target) {
  if (
    typeof current !== "number" ||
    typeof start !== "number" ||
    typeof target !== "number"
  )
    return 0;
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

export default function GoalsPage({ currentUser }) {
  const { weights, people } = useData();
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState("");
  const [targetKg, setTargetKg] = useState("");
  const [targetDate, setTargetDate] = useState("");

  useEffect(() => {
    setGoals(loadGoals());
  }, []);

  const currentWeight = useMemo(() => {
    if (!currentUser) return null;
    const userWeights = weights
      .filter((w) => w.personId === currentUser.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    return userWeights.length ? userWeights[userWeights.length - 1].kg : null;
  }, [currentUser, weights]);

  const startWeight = useMemo(() => {
    if (!currentUser) return null;
    const userWeights = weights
      .filter((w) => w.personId === currentUser.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    return userWeights.length ? userWeights[0].kg : null;
  }, [currentUser, weights]);

  const userGoals = useMemo(
    () => goals.filter((goal) => goal.personId === currentUser?.id),
    [goals, currentUser],
  );

  const addGoal = useCallback(
    (e) => {
      e.preventDefault();
      if (!currentUser || !title.trim() || !targetKg || !targetDate) return;
      const next = [
        ...goals,
        {
          id: uid(),
          personId: currentUser.id,
          title: title.trim(),
          targetKg: Number(targetKg),
          targetDate,
          createdAt: new Date().toISOString(),
        },
      ];
      setGoals(saveGoals(next));
      setTitle("");
      setTargetKg("");
      setTargetDate("");
    },
    [currentUser, goals, targetKg, targetDate, title],
  );

  const removeGoal = useCallback(
    (goalId) => {
      const next = goals.filter((goal) => goal.id !== goalId);
      setGoals(saveGoals(next));
    },
    [goals],
  );

  return (
    <div style={{ padding: "16px" }}>
      <h2>Goals</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
        Create weight targets and track progress with badges when you hit them.
      </p>

      {!currentUser ? (
        <div className="empty-state-card">
          <p>Please select a user to manage goals.</p>
        </div>
      ) : (
        <>
          <form className="goals-form" onSubmit={addGoal}>
            <label>
              Goal name
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Lose 3 kg by summer"
              />
            </label>
            <label>
              Target weight (kg)
              <input
                type="number"
                min="0"
                step="0.1"
                value={targetKg}
                onChange={(e) => setTargetKg(e.target.value)}
              />
            </label>
            <label>
              Target date
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </label>
            <button className="primary" type="submit">
              Save goal
            </button>
          </form>

          <div className="goal-summary-card">
            <strong>Current weight</strong>
            <div>
              {currentWeight
                ? `${currentWeight.toFixed(1)} kg`
                : "No weights yet"}
            </div>
            <strong>Start weight</strong>
            <div>
              {startWeight ? `${startWeight.toFixed(1)} kg` : "No weights yet"}
            </div>
          </div>

          {userGoals.length === 0 ? (
            <div className="empty-state-card">
              <p>No goals set. Add one to start tracking progress.</p>
            </div>
          ) : (
            <div className="goal-list">
              {userGoals.map((goal) => {
                const progress = computeProgress(
                  currentWeight,
                  startWeight,
                  goal.targetKg,
                );
                const achieved =
                  currentWeight !== null &&
                  Math.abs(currentWeight - goal.targetKg) <= 0.2;
                return (
                  <div key={goal.id} className="goal-card">
                    <div className="goal-card-header">
                      <div>
                        <strong>{goal.title}</strong>
                        <div className="goal-meta">
                          Target: {goal.targetKg.toFixed(1)} kg by{" "}
                          {goal.targetDate}
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
                    <button type="button" onClick={() => removeGoal(goal.id)}>
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
