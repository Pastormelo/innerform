"use client";

import React from "react";
import * as Icons from "lucide-react";

/** Render a Lucide icon by its string name (from constants), with a safe fallback. */
export function DynIcon({ name, size = 20, color }: { name: string; size?: number; color?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[name] ?? Icons.Utensils;
  return <Cmp size={size} color={color} />;
}
