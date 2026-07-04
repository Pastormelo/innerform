"use client";

import React from "react";

export const RING_COLORS: Record<string, [string, string]> = {
  energy: ["#3BAA74", "#2E8B57"],
  protein: ["#3B6FE0", "#5B8AF0"],
  carbs: ["#E8A83E", "#D98A20"],
  fat: ["#A58BDD", "#6F51B0"],
  fiber: ["#74C9F0", "#2E98D6"],
  forest: ["#4FC58C", "#1F5E4A"],
  gold: ["#E6BC6B", "#B9862B"],
};

let ringId = 0;

export interface ActivityRingProps {
  value: number; // 0–1 (can exceed 1; clamped)
  size?: number;
  thickness?: number;
  color?: keyof typeof RING_COLORS;
  glow?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Apple-Fitness style progress ring: gradient stroke, round cap, springy fill on mount. */
export function ActivityRing({ value, size = 120, thickness = 14, color = "energy", glow = false, children, style }: ActivityRingProps) {
  const [id] = React.useState(() => `ifring-${++ringId}`);
  const stops = RING_COLORS[color] ?? RING_COLORS.energy;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, value));
  const target = c * (1 - frac);

  return (
    <div style={{ position: "relative", width: size, height: size, ...style }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={stops[0]} />
            <stop offset="100%" stopColor={stops[1]} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={target}
          style={
            {
              "--if-c": c,
              animation: "if-ring-fill var(--dur-ring) var(--ease-spring) both",
              transition: "stroke-dashoffset var(--dur-ring) var(--ease-spring)",
              filter: glow ? `drop-shadow(0 0 8px ${stops[0]}88)` : "none",
            } as React.CSSProperties
          }
        />
      </svg>
      {children != null && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          {children}
        </div>
      )}
    </div>
  );
}

/** Concentric ring stack (calories / protein / water) — the dashboard hero. */
export function RingStack({
  rings,
  size = 180,
  thickness = 16,
  gap = 4,
  children,
}: {
  rings: { value: number; color: keyof typeof RING_COLORS }[];
  size?: number;
  thickness?: number;
  gap?: number;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {rings.map((ring, i) => {
        const inset = i * (thickness + gap);
        const s = size - inset * 2;
        return (
          <div key={i} style={{ position: "absolute", top: inset, left: inset }}>
            <ActivityRing value={ring.value} size={s} thickness={thickness} color={ring.color} glow={i === 0} />
          </div>
        );
      })}
      {children != null && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          {children}
        </div>
      )}
    </div>
  );
}
