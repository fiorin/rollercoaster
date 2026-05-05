import React from "react";
import { ACTIVITIES } from "../utils/activities";
import ActivityButton from "./ActivityButton";

/**
 * ActivityButtons component for selecting multiple activities
 */
const ActivityButtons = React.memo(
  ({ activities, onChange, readOnly = false }) => {
    return (
      <div className="activities">
        {ACTIVITIES.map((activity) => (
          <ActivityButton
            key={activity.key}
            activityKey={activity.key}
            isActive={activities?.[activity.key] || false}
            onChange={(key) => {
              if (!readOnly) {
                onChange?.({ ...activities, [key]: !activities[key] });
              }
            }}
            readOnly={readOnly}
          />
        ))}
      </div>
    );
  },
);

ActivityButtons.displayName = "ActivityButtons";

export default ActivityButtons;
