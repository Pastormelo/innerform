"use client";

import React from "react";

export interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${options.length}, 1fr)`,
        gap: 4,
        padding: 4,
        borderRadius: "var(--radius-md)",
        background: "var(--surface-inset)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              height: 38,
              borderRadius: "var(--radius-sm)",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              fontWeight: active ? 700 : 500,
              background: active ? "var(--surface-card-2)" : "transparent",
              color: active ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: active ? "var(--glass-highlight)" : "none",
              transition: "background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
