"use client";

import React from "react";

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: "pointer" }}>
      {label && <span style={{ fontSize: 14.5, color: "var(--text-primary)" }}>{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 48,
          height: 28,
          borderRadius: 999,
          border: "none",
          padding: 3,
          cursor: "pointer",
          background: checked ? "var(--forest-500)" : "var(--border-strong)",
          transition: "background var(--dur-base) var(--ease-out)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            display: "block",
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#fff",
            transform: checked ? "translateX(20px)" : "translateX(0)",
            transition: "transform var(--dur-base) var(--ease-spring)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </button>
    </label>
  );
}
