"use client";

import React, { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand/Logo";

/* ============================================================
   Branded "the app is working on something" overlay (#4).
   Shows the mark breathing inside an orbiting ring while it
   cycles through status lines. Callers control duration; the
   product's heavy actions run it for ~8s so generation feels
   considered, not instant.
   ============================================================ */

export function GeneratingOverlay({ open, steps }: { open: boolean; steps: string[] }) {
  // Callers remount this via `key` each time they open it, so state starts fresh
  // at 0 and no in-effect reset is needed.
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!open) return;
    const per = Math.max(1200, Math.floor(8000 / Math.max(steps.length, 1)));
    const id = setInterval(() => setI((v) => (v + 1 < steps.length ? v + 1 : v)), per);
    return () => clearInterval(id);
  }, [open, steps.length]);

  if (!open) return null;

  return (
    <div
      className="if-fade-in"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "color-mix(in srgb, var(--surface-app) 82%, transparent)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ position: "relative", width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg className="if-loader-orbit" width={120} height={120} viewBox="0 0 120 120" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="if-load-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--forest-400)" />
              <stop offset="100%" stopColor="var(--forest-600)" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-subtle)" strokeWidth="4" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="url(#if-load-grad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="90 240"
          />
        </svg>
        <span className="if-loader-breathe">
          <LogoMark size={56} />
        </span>
      </div>

      <div style={{ minHeight: 26 }}>
        <div key={i} className="if-fade-up" style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
          {steps[i] ?? steps[steps.length - 1]}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        {steps.map((_, idx) => (
          <span
            key={idx}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: idx <= i ? "var(--forest-500)" : "var(--border-strong)",
              transition: "background var(--dur-base) var(--ease-out)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** Small inline spinner for buttons/sections. */
export function InlineSpinner({ size = 18 }: { size?: number }) {
  return (
    <span
      className="if-loader-orbit"
      style={{
        display: "inline-block",
        width: size,
        height: size,
        border: "2.5px solid var(--border-strong)",
        borderTopColor: "var(--forest-500)",
        borderRadius: "50%",
      }}
    />
  );
}
