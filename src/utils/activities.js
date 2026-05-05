// Unified activity configuration
export const ACTIVITIES = [
  {
    key: "gym",
    label: "Gym",
    icon: "💪",
    color: "#FBC02D",
    colorLight: "#FFF9C4",
    colorDark: "#F9A825",
  },
  {
    key: "bike",
    label: "Bike",
    icon: "🚴",
    color: "#4CAF50",
    colorLight: "#C8E6C9",
    colorDark: "#388E3C",
  },
  {
    key: "boxing",
    label: "Boxing",
    icon: "🥊",
    color: "#F44336",
    colorLight: "#FFCDD2",
    colorDark: "#D32F2F",
  },
  {
    key: "run",
    label: "Running",
    icon: "🏃",
    color: "#2196F3",
    colorLight: "#BBDEFB",
    colorDark: "#1565C0",
  },
];

export const ACTIVITY_KEYS = {
  GYM: "gym",
  BIKE: "bike",
  BOXING: "boxing",
  RUNNING: "run",
};

export function getActivityByKey(key) {
  return ACTIVITIES.find((a) => a.key === key);
}
