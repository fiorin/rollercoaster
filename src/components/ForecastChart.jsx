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
import dayjs from "dayjs";

function computeForecast(series, daysAhead = 7) {
  const points = series.raw
    .map((value, index) => ({ x: index, y: value }))
    .filter((point) => typeof point.y === "number" && !Number.isNaN(point.y));
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
  const today = dayjs(series.labels[series.labels.length - 1]);

  return Array.from({ length: daysAhead }, (_, i) => {
    const nextIndex = lastIndex + i + 1;
    return {
      date: today.add(i + 1, "day").format("YYYY-MM-DD"),
      forecast: slope * nextIndex + intercept,
    };
  });
}

function ForecastChart({ series }) {
  const forecastData = useMemo(() => {
    if (!series.labels.length) return [];
    return computeForecast(series, 7).map((point) => ({
      ...point,
      date: dayjs(point.date).format("MMM D"),
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
