"use client";

import React from "react";
import * as Icons from "lucide-react";
import type { FoodGrade, FoodItem, GoalDirection } from "@/types";
import { scoreFoodForGoal, TIER_COLORS } from "@/lib/food-quality/scoring";
import { foodIcon, GRADE_COLORS } from "@/lib/constants";
import { Pill } from "@/components/ui/Chip";

/** FDA reference Daily Values (adult) for the %DV column. */
const DV: Record<string, number> = {
  fat: 78,
  saturatedFat: 20,
  cholesterol: 300,
  sodium: 2300,
  carbs: 275,
  fiber: 28,
  addedSugar: 50,
  protein: 50,
  calcium: 1300,
  iron: 18,
  potassium: 4700,
};

/** Goal-aware grade prefix, mirroring MyNetDiary's "low-carb C" treatment. */
function goalWord(direction: GoalDirection): string {
  return direction === "loss" ? "cutting" : direction === "gain" ? "gaining" : "balanced";
}
const pct = (value: number, dv: number) => `${Math.round((value / dv) * 100)}%`;

/** Derive a letter grade for foods without one (seed items) from base quality. */
export function gradeFor(food: FoodItem): FoodGrade {
  if (food.grade) return food.grade;
  const q = food.baseQuality;
  if (q >= 85) return "A";
  if (q >= 70) return "B";
  if (q >= 55) return "C";
  if (q >= 40) return "D";
  return "E";
}

export function GradeBadge({ grade, size = 40 }: { grade: FoodGrade; size?: number }) {
  if (!grade) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: 12,
        background: GRADE_COLORS[grade],
        color: "#fff",
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        fontSize: size * 0.5,
        lineHeight: 1,
      }}
      title={`Nutrition grade ${grade}`}
    >
      {grade}
    </span>
  );
}

export function FoodIcon({ food, size = 22 }: { food: Pick<FoodItem, "name" | "groceryCategory" | "gainCategories">; size?: number }) {
  const name = foodIcon({ name: food.name, groceryCategory: food.groceryCategory, gainCategories: food.gainCategories });
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[name] ?? Icons.Utensils;
  return <Cmp size={size} color="var(--text-secondary)" />;
}

function Row({
  label,
  value,
  unit,
  bold,
  indent,
  dv,
  showDV,
}: {
  label: string;
  value: number | undefined;
  unit: string;
  bold?: boolean;
  indent?: boolean;
  dv?: number;
  showDV?: boolean;
}) {
  if (value == null || (value === 0 && indent)) return null;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        padding: "6px 0",
        borderTop: "1px solid var(--border-subtle)",
        fontSize: 14,
        fontWeight: bold ? 700 : 400,
        paddingLeft: indent ? 16 : 0,
      }}
    >
      <span>
        {label} <span className="if-num" style={{ fontWeight: bold ? 700 : 400 }}>{Math.round(value)}{unit}</span>
      </span>
      {showDV && dv != null && <span className="if-num" style={{ fontWeight: 700 }}>{pct(value, dv)}</span>}
    </div>
  );
}

/** Full nutrition-facts label for a food at a given quantity, goal-aware. */
export function FoodLabel({ food, quantity = 1, direction }: { food: FoodItem; quantity?: number; direction: GoalDirection }) {
  const [showDV, setShowDV] = React.useState(false);
  const q = scoreFoodForGoal(food, direction);
  const m = food.micros ?? {};
  const scale = quantity;
  const grade = gradeFor(food);
  const netCarbs = Math.max(0, food.carbs - food.fiber) * scale;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Header — food + goal-aware grade */}
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        {food.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={food.imageUrl}
            alt={food.name}
            style={{ width: 68, height: 68, borderRadius: "var(--radius-md)", objectFit: "cover", background: "var(--surface-inset)", flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "var(--radius-md)",
              background: "var(--surface-inset)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FoodIcon food={food} size={30} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>{food.name}</div>
          {food.brand && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{food.brand}</div>}
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>
            per {food.servingSize} {food.servingUnit}
            {quantity !== 1 && ` · showing ×${quantity}`}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Grade</span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: GRADE_COLORS[grade ?? "C"], textTransform: "uppercase", lineHeight: 1.05, textAlign: "right" }}>
            <span style={{ fontSize: 15 }}>{goalWord(direction)}</span>
            <br />
            <span style={{ fontSize: 26 }}>{grade}</span>
          </span>
        </div>
      </div>

      {/* Goal fit */}
      <div className="if-glass" style={{ padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>For your goal</span>
        <Pill color={TIER_COLORS[q.tier]}>
          {q.label} · {q.score}
        </Pill>
      </div>

      {/* Nutrition facts */}
      <div style={{ border: "2px solid var(--text-primary)", borderRadius: "var(--radius-md)", padding: 14 }}>
        <div className="if-display" style={{ fontSize: 22, borderBottom: "6px solid var(--text-primary)", paddingBottom: 4, marginBottom: 4 }}>
          Nutrition Facts
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "4px 0", borderBottom: "3px solid var(--text-primary)" }}>
          <span style={{ fontWeight: 700 }}>Calories</span>
          <span className="if-num" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30 }}>
            {Math.round(food.calories * scale)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowDV((v) => !v)}
          style={{ background: "none", border: "none", color: "var(--forest-500)", fontWeight: 700, fontSize: 13, cursor: "pointer", padding: "8px 0", width: "100%", textAlign: showDV ? "right" : "center" }}
        >
          {showDV ? "% Daily Value*" : "Show % Daily Value*"}
        </button>
        <Row label="Total Fat" value={food.fat * scale} unit="g" bold dv={DV.fat} showDV={showDV} />
        <Row label="Saturated Fat" value={m.saturatedFat != null ? m.saturatedFat * scale : undefined} unit="g" indent dv={DV.saturatedFat} showDV={showDV} />
        <Row label="Trans Fat" value={m.transFat != null ? m.transFat * scale : undefined} unit="g" indent />
        <Row label="Cholesterol" value={m.cholesterol != null ? m.cholesterol * scale : undefined} unit="mg" bold dv={DV.cholesterol} showDV={showDV} />
        <Row label="Sodium" value={food.sodium != null ? food.sodium * scale : undefined} unit="mg" bold dv={DV.sodium} showDV={showDV} />
        <Row label="Total Carbohydrate" value={food.carbs * scale} unit="g" bold dv={DV.carbs} showDV={showDV} />
        <Row label="Dietary Fiber" value={food.fiber * scale} unit="g" indent dv={DV.fiber} showDV={showDV} />
        <Row label="Total Sugars" value={food.sugar * scale} unit="g" indent />
        <Row label="Added Sugars" value={m.addedSugar != null ? m.addedSugar * scale : undefined} unit="g" indent dv={DV.addedSugar} showDV={showDV} />
        {/* Net Carbs — highlighted like the reference */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid var(--border-subtle)", fontSize: 14, fontWeight: 700 }}>
          <span>Net Carbs <span className="if-num">{Math.round(netCarbs)}g</span></span>
        </div>
        <Row label="Protein" value={food.protein * scale} unit="g" bold dv={DV.protein} showDV={showDV} />
        <Row label="Calcium" value={m.calcium != null ? m.calcium * scale : undefined} unit="mg" dv={DV.calcium} showDV={showDV} />
        <Row label="Iron" value={m.iron != null ? m.iron * scale : undefined} unit="mg" dv={DV.iron} showDV={showDV} />
        <Row label="Potassium" value={m.potassium != null ? m.potassium * scale : undefined} unit="mg" dv={DV.potassium} showDV={showDV} />
        {showDV && <p style={{ fontSize: 10.5, color: "var(--text-muted)", margin: "8px 0 0" }}>* Percent Daily Values are based on a 2,000 calorie diet.</p>}
      </div>

      {/* Ingredients */}
      {food.ingredients && (
        <div>
          <div className="if-overline" style={{ color: "var(--text-muted)", marginBottom: 6 }}>
            Ingredients
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>{food.ingredients}</p>
        </div>
      )}
      {food.source === "open_food_facts" && (
        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Data from Open Food Facts. Verify against the physical label.</p>
      )}
    </div>
  );
}
