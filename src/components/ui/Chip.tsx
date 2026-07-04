"use client";

import React from "react";

export interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  color?: string;
  size?: "sm" | "md";
}

/** Selectable pill chip — used for multi-select options and filters. */
export function Chip({ label, selected = false, onClick, color = "var(--forest-500)", size = "md" }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: size === "sm" ? 30 : 38,
        padding: size === "sm" ? "0 12px" : "0 16px",
        borderRadius: "var(--radius-pill)",
        fontFamily: "var(--font-sans)",
        fontSize: size === "sm" ? 13 : 14,
        fontWeight: 600,
        cursor: onClick ? "pointer" : "default",
        background: selected ? color : "var(--surface-card)",
        color: selected ? "var(--ink-950)" : "var(--text-secondary)",
        border: `1px solid ${selected ? "transparent" : "var(--border-subtle)"}`,
        transition: "background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-spring)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {label}
    </button>
  );
}

/** Small status pill (non-interactive). */
export function Pill({ children, color = "var(--forest-500)", bg }: { children: React.ReactNode; color?: string; bg?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: "var(--radius-pill)",
        fontSize: 12,
        fontWeight: 700,
        color,
        background: bg ?? "color-mix(in srgb, currentColor 12%, transparent)",
        border: "1px solid color-mix(in srgb, currentColor 25%, transparent)",
        lineHeight: 1.4,
      }}
    >
      {children}
    </span>
  );
}
