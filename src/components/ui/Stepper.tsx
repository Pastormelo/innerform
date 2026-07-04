"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";

export interface StepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
}

/** Serving/portion adjuster. */
export function Stepper({ value, onChange, min = 0.25, max = 20, step = 0.25, format }: StepperProps) {
  const btn: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border-subtle)",
    background: "var(--surface-card)",
    color: "var(--text-primary)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  };
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
      <button type="button" style={btn} onClick={() => onChange(Math.max(min, Math.round((value - step) * 100) / 100))} aria-label="Decrease">
        <Minus size={18} />
      </button>
      <span className="if-num" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, minWidth: 56, textAlign: "center" }}>
        {format ? format(value) : value}
      </span>
      <button type="button" style={btn} onClick={() => onChange(Math.min(max, Math.round((value + step) * 100) / 100))} aria-label="Increase">
        <Plus size={18} />
      </button>
    </div>
  );
}
