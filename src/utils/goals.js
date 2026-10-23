const GOALS_KEY = "weight_goals";

export function loadGoals() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(GOALS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGoals(goals) {
  if (typeof window === "undefined") return goals;
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  } catch {
    /* storage indisponível — mantém em memória */
  }
  return goals;
}

/** Drops every goal that belongs to a person that no longer exists. */
export function removeGoalsForPerson(personId) {
  return saveGoals(loadGoals().filter((goal) => goal.personId !== personId));
}

export { GOALS_KEY };
