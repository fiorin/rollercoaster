import React, { memo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
} from "recharts";

function MainWeightChart({ chartData, showActivities }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 150]} label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#1f78b4"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="avg7"
          stroke="#33a02c"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="avg30"
          stroke="#fb9a99"
          strokeWidth={2}
          strokeDasharray="10 5"
          dot={false}
        />
        {showActivities.gym && (
          <Scatter dataKey="gym" fill="#FBC02D" shape="square" />
        )}
        {showActivities.bike && (
          <Scatter dataKey="bike" fill="#4CAF50" shape="square" />
        )}
        {showActivities.boxing && (
          <Scatter dataKey="boxing" fill="#F44336" shape="square" />
        )}
        {showActivities.run && (
          <Scatter dataKey="run" fill="#2196F3" shape="square" />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

MainWeightChart.displayName = "MainWeightChart";

export default memo(MainWeightChart);
