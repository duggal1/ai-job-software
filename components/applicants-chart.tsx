"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ApplicantsChart({ days }: { days: Array<{ day: string; count: number }> }) {
  const total = days.reduce((s, d) => s + d.count, 0);
  return (
    <div
      className="h-48 min-w-0 sm:h-56"
      role="img"
      aria-label={`${total} applications over the last 14 days.`}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={days} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="#e7e5e4" />
          <XAxis
            dataKey="day"
            tickFormatter={(day: string) => day.slice(5)}
            tick={{ fill: "#a8a29e", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={38}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#a8a29e", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid rgba(231, 229, 228, 0.9)",
              borderRadius: 6,
              fontSize: 12,
              color: "#1c1917",
            }}
            cursor={{ stroke: "#d6d3d1" }}
            formatter={(value) => [Number(value), "Applications"]}
            labelFormatter={(day) => String(day ?? "")}
          />
          <Area
            type="monotone"
            dataKey="count"
            name="Applications"
            stroke="#1c1917"
            fill="#1c1917"
            fillOpacity={0.08}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
