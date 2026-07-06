"use client";

import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatShort } from "@/lib/dates";
import type { DailyTargets, DayStats } from "@/types";

const axis = { stroke: "rgba(255,255,255,0.25)", fontSize: 11, fontFamily: "var(--font-sans)" };
const tooltipStyle = {
  background: "var(--ink-850)",
  border: "1px solid var(--glass-border)",
  borderRadius: 12,
  fontSize: 13,
  color: "#fff",
};

export default function Charts({
  weighData,
  days,
  targets,
  stepsGoal,
}: {
  weighData: { date: string; weight: number }[];
  days: DayStats[];
  targets: DailyTargets | null;
  stepsGoal?: number;
}) {
  const calData = days.map((d) => ({ date: formatShort(d.date), calories: d.calories, target: d.targetCalories }));
  const proteinData = days.map((d) => ({ date: formatShort(d.date), protein: d.protein, target: d.targetProtein }));
  const waterData = days.map((d) => ({ date: formatShort(d.date), water: d.waterOz, target: d.targetWaterOz }));
  const stepsData = days.map((d) => ({ date: formatShort(d.date), steps: d.steps }));
  const burnData = days.map((d) => ({ date: formatShort(d.date), burned: d.caloriesBurned }));
  const hasSteps = days.some((d) => d.steps > 0);
  const hasBurn = days.some((d) => d.caloriesBurned > 0);

  return (
    <>
      <Card padding={16}>
        <CardTitle>Weight over time</CardTitle>
        {weighData.length < 2 ? (
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>
            Log at least two weigh-ins to see the trend line. The scale is data, not judgment.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weighData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3BAA74" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3BAA74" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="date" {...axis} tickLine={false} axisLine={false} />
              <YAxis {...axis} tickLine={false} axisLine={false} domain={["dataMin - 3", "dataMax + 3"]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="weight" stroke="#3BAA74" strokeWidth={2.5} fill="url(#wgrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card padding={16}>
        <CardTitle>Calories vs target — last 14 days</CardTitle>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={calData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" {...axis} tickLine={false} axisLine={false} interval={2} />
            <YAxis {...axis} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            {targets && <ReferenceLine y={targets.calories} stroke="#E8A83E" strokeDasharray="4 4" />}
            <Bar dataKey="calories" fill="#3BAA74" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card padding={16}>
        <CardTitle>Protein vs target</CardTitle>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={proteinData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" {...axis} tickLine={false} axisLine={false} interval={2} />
            <YAxis {...axis} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            {targets && <ReferenceLine y={targets.protein} stroke="#5B8AF0" strokeDasharray="4 4" />}
            <Bar dataKey="protein" fill="#3B6FE0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card padding={16}>
        <CardTitle>Water vs target</CardTitle>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={waterData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" {...axis} tickLine={false} axisLine={false} interval={2} />
            <YAxis {...axis} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            {targets && <ReferenceLine y={targets.waterOz} stroke="#74C9F0" strokeDasharray="4 4" />}
            <Bar dataKey="water" fill="#4FB6E8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {hasSteps && (
        <Card padding={16}>
          <CardTitle>Steps</CardTitle>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stepsData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="date" {...axis} tickLine={false} axisLine={false} interval={2} />
              <YAxis {...axis} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              {stepsGoal && <ReferenceLine y={stepsGoal} stroke="#4FB6E8" strokeDasharray="4 4" />}
              <Bar dataKey="steps" fill="#4FB6E8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {hasBurn && (
        <Card padding={16}>
          <CardTitle>Calories burned</CardTitle>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={burnData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="date" {...axis} tickLine={false} axisLine={false} interval={2} />
              <YAxis {...axis} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="burned" fill="#E67E22" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </>
  );
}
