import React from "react";
import { ACTIVITIES, getActivityByKey } from "../utils/activities";

/**
 * ActivityButton component for selecting activities
 * Can be used in buttons or read-only mode
 */
const ActivityButton = React.memo(
  ({
    activityKey,
    isActive = false,
    onChange,
    readOnly = false,
    size = "md",
  }) => {
    const activity = getActivityByKey(activityKey);

    if (!activity) return null;

    const sizeClasses = {
      sm: "activity-btn-sm",
      md: "activity-btn-md",
      lg: "activity-btn-lg",
    };

    if (readOnly) {
      return (
        <div
          className={`activity-indicator ${activity.key} ${isActive ? "active" : "inactive"}`}
          title={activity.label}
        >
          {activity.icon}
        </div>
      );
    }

    return (
      <button
        type="button"
        className={`act ${activity.key} ${isActive ? "sel" : ""} ${sizeClasses[size] || ""}`}
        onClick={() => onChange?.(activity.key)}
        title={activity.label}
      >
        {activity.icon}
      </button>
    );
  },
);

ActivityButton.displayName = "ActivityButton";

export default ActivityButton;
