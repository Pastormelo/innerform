import React from "react";
import { Card } from "./Card";

export interface StatTileProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

/** Big-numeral metric tile. */
export function StatTile({ label, value, sub, accent = "var(--text-primary)" }: StatTileProps) {
  return (
    <Card padding={16}>
      <div className="if-overline" style={{ color: "var(--text-muted)", marginBottom: 8 }}>
        {label}
      </div>
      <div
        className="if-num"
        style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-metric-md)", lineHeight: 1, color: accent }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>{sub}</div>}
    </Card>
  );
}
