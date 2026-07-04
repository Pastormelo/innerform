"use client";

import React from "react";

const MACRO_GRADS: Record<string, string> = {
  energy: "var(--grad-energy)",
  protein: "var(--grad-protein)",
  carbs: "var(--grad-carbs)",
  fat: "var(--grad-fat)",
  fiber: "var(--grad-fiber)",
  gold: "var(--grad-gold)",
  navy: "var(--grad-navy)",
};

export interface MacroBarProps {
  label: string;
  value: number;
  target: number;
  unit?: string;
  color?: keyof typeof MACRO_GRADS;
}

/** Labeled macro progress bar with tabular numerals. */
export function MacroBar({ label, value, target, unit = "g", color = "protein" }: MacroBarProps) {
  const frac = target > 0 ? Math.min(1, value / target) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{label}</span>
        <span className="if-num" style={{ fontSize: 13, color: "var(--text-muted)" }}>
          <strong style={{ color: "var(--text-primary)", fontWeight: 700 }}>{Math.round(value)}</strong>
          {" / "}
          {Math.round(target)}
          {unit}
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "var(--border-subtle)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${frac * 100}%`,
            borderRadius: 999,
            background: MACRO_GRADS[color],
            animation: "if-bar-fill var(--dur-ring) var(--ease-spring) both",
            transition: "width var(--dur-ring) var(--ease-spring)",
          }}
        />
      </div>
    </div>
  );
}

export function ProgressBar({ value, color = "energy", height = 8 }: { value: number; color?: keyof typeof MACRO_GRADS; height?: number }) {
  return (
    <div style={{ height, borderRadius: 999, background: "var(--border-subtle)", overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${Math.min(100, Math.max(0, value * 100))}%`,
          borderRadius: 999,
          background: MACRO_GRADS[color],
          transition: "width var(--dur-ring) var(--ease-spring)",
        }}
      />
    </div>
  );
}
