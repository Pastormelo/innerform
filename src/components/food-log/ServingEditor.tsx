"use client";

import React from "react";
import type { FoodItem } from "@/types";

/* ============================================================
   Editable serving size (like MyNetDiary): type a serving count
   OR a weight in g/oz/lb. Emits the resulting multiplier (× the
   food's per-serving values) so callers scale macros uniformly.
   Weight units only appear when the food has a known gram basis.
   ============================================================ */

const G_PER: Record<string, number> = { g: 1, oz: 28.3495, lb: 453.592 };

/** grams represented by one serving, if determinable. */
export function gramsPerServing(food: FoodItem): number | null {
  const u = food.servingUnit.toLowerCase();
  if (u === "g" || u === "gram" || u === "grams" || u === "ml") return food.servingSize;
  if (u === "oz") return food.servingSize * G_PER.oz;
  if (u === "lb") return food.servingSize * G_PER.lb;
  return null; // e.g. "cup", "eggs", "package" — serving-count editing only
}

export function ServingEditor({ food, onMultiplier }: { food: FoodItem; onMultiplier: (m: number) => void }) {
  const gps = gramsPerServing(food);
  const [unit, setUnit] = React.useState<"serving" | "g" | "oz" | "lb">("serving");
  const [amount, setAmount] = React.useState("1");

  const num = Math.max(0, parseFloat(amount) || 0);
  const multiplier = unit === "serving" ? num : gps ? (num * G_PER[unit]) / gps : num;
  const grams = gps ? Math.round(multiplier * gps) : null;
  const cals = Math.round(food.calories * multiplier);

  React.useEffect(() => {
    onMultiplier(multiplier);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiplier]);

  const units: ("serving" | "g" | "oz" | "lb")[] = gps ? ["serving", "g", "oz", "lb"] : ["serving"];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            aria-label="Amount"
            style={{
              width: 110,
              background: "transparent",
              border: "none",
              borderBottom: "2px solid var(--forest-500)",
              color: "var(--forest-400)",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 40,
              padding: "0 0 4px",
            }}
          />
          <span style={{ fontSize: 16, color: "var(--text-secondary)", marginLeft: 8 }}>{unit === "serving" ? (num === 1 ? "serving" : "servings") : unit}</span>
          {grams != null && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Weight: {grams} g</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="if-num" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 34, color: "var(--text-primary)" }}>{cals}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>calories</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {units.map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => {
              // Convert the current amount so the physical portion stays constant.
              if (u === unit) return;
              if (gps) {
                const curGrams = unit === "serving" ? num * gps : num * G_PER[unit];
                const next = u === "serving" ? curGrams / gps : curGrams / G_PER[u];
                setAmount(String(Math.round(next * 100) / 100));
              }
              setUnit(u);
            }}
            style={{
              flex: "1 1 60px",
              height: 42,
              borderRadius: "var(--radius-sm)",
              border: `1px solid ${unit === u ? "var(--forest-500)" : "var(--border-subtle)"}`,
              background: unit === u ? "color-mix(in srgb, var(--forest-500) 16%, transparent)" : "var(--surface-card)",
              color: unit === u ? "var(--forest-400)" : "var(--text-secondary)",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {u === "serving" ? "serving" : u}
          </button>
        ))}
      </div>
    </div>
  );
}
