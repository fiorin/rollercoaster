import React, { memo, useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, Tooltip } from "recharts";

function ActivityCharts({ activityCharts, series }) {
  const renderedCharts = useMemo(
    () =>
      activityCharts.map((activity) => {
        const rechartsData = series.labels.map((date, index) => ({
          date,
          value: activity.data[index],
        }));

        return (
          <div key={activity.key} className="mini-chart-card">
            <div className="mini-chart-title">
              <span>{activity.icon}</span>
              <div>
                <strong>{activity.label}</strong>
                <small>{activity.count} days tracked</small>
              </div>
            </div>
            <div className="mini-chart-canvas">
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={rechartsData}>
                  <Bar dataKey="value" fill={activity.color} radius={8} />
                  <Tooltip
                    formatter={(value) => (value === 1 ? "Present" : "")}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      }),
    [activityCharts, series.labels],
  );

  return <div className="activity-chart-grid">{renderedCharts}</div>;
}

ActivityCharts.displayName = "ActivityCharts";

export default memo(ActivityCharts);
