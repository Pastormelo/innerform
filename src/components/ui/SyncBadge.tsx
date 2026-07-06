"use client";

import React from "react";
import { Check, Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useApp } from "@/lib/store/AppStoreProvider";

/* ============================================================
   Small cloud-sync status pill. Only renders in Supabase mode
   (demo/local mode has nothing to sync).
   ============================================================ */
export function SyncBadge() {
  const { supabaseMode, syncStatus } = useApp();
  if (!supabaseMode) return null;

  const map = {
    idle: { icon: <Cloud size={12} />, label: "Cloud", color: "var(--text-muted)" },
    saving: { icon: <RefreshCw size={12} className="if-loader-orbit" />, label: "Saving", color: "var(--fiber-500)" },
    synced: { icon: <Check size={12} />, label: "Synced", color: "var(--forest-500)" },
    offline: { icon: <CloudOff size={12} />, label: "Offline", color: "var(--warning-500)" },
  }[syncStatus];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: "var(--radius-pill)",
        fontSize: 11.5,
        fontWeight: 600,
        color: map.color,
        background: "color-mix(in srgb, currentColor 12%, transparent)",
        border: "1px solid color-mix(in srgb, currentColor 24%, transparent)",
      }}
    >
      {map.icon}
      {map.label}
    </span>
  );
}
