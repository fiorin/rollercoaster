import React, { memo, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { addDays, formatShort } from "../utils/date";

function computeForecast(series, daysAhead = 7) {
  const source = Array.isArray(series.measured)
    ? series.measured
    : series.raw
        .map((value, index) => ({ x: index, y: value }))
        .filter((point) => typeof point.y === "number" && !Number.isNaN(point.y));

  const points = source.filter(
    (point) => typeof point.y === "number" && !Number.isNaN(point.y),
  );
  const n = points.length;
  if (n < 2) return [];

  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);
  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  const lastIndex = points[n - 1].x;
  // Project from the last measured day, not from the end of the window.
  const lastDate = series.labels[lastIndex];

  return Array.from({ length: daysAhead }, (_, i) => {
    const nextIndex = lastIndex + i + 1;
    return {
      date: addDays(lastDate, i + 1),
      forecast: slope * nextIndex + intercept,
    };
  });
}

function ForecastChart({ series }) {
  const forecastData = useMemo(() => {
    if (!series.labels.length) return [];
    return computeForecast(series, 7).map((point) => ({
      ...point,
      date: formatShort(point.date),
    }));
  }, [series]);

  if (!forecastData.length) return null;

  return (
    <div className="forecast-chart-card">
      <div className="forecast-chart-header">
        <strong>7-day Forecast</strong>
        <span>Projected trend line based on recent weights</span>
      </div>
      <div className="forecast-chart-canvas">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#ff9800"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

ForecastChart.displayName = "ForecastChart";

export default memo(ForecastChart);
