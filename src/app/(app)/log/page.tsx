"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Plus, Search, Trash2 } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip, Pill } from "@/components/ui/Chip";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Stepper } from "@/components/ui/Stepper";
import { NavHeader } from "@/components/ui/NavHeader";
import { useApp } from "@/lib/store/AppStoreProvider";
import { SEED_FOODS, getFoodById, searchSeedFoods } from "@/data/foods";
import { scoreFoodForGoal, TIER_COLORS } from "@/lib/food-quality/scoring";
import { goalDirection } from "@/lib/nutrition/calculations";
import { addDays, formatShort, isToday, todayStr } from "@/lib/dates";
import type { FoodItem, MealType } from "@/types";

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
  { value: "custom", label: "Custom" },
];

export default function LogPage() {
  const { data, logFood, removeFoodLog } = useApp();
  const profile = data.profile!;
  const dir = goalDirection(profile.primaryGoal);

  const [date, setDate] = useState(todayStr());
  const [addOpen, setAddOpen] = useState<MealType | null>(null);

  const dayLogs = data.foodLogs.filter((l) => l.logDate === date);
  const totals = {
    calories: Math.round(dayLogs.reduce((s, l) => s + l.calories, 0)),
    protein: Math.round(dayLogs.reduce((s, l) => s + l.protein, 0)),
    carbs: Math.round(dayLogs.reduce((s, l) => s + l.carbs, 0)),
    fat: Math.round(dayLogs.reduce((s, l) => s + l.fat, 0)),
  };

  function copyYesterday() {
    const yesterday = addDays(date, -1);
    const yLogs = data.foodLogs.filter((l) => l.logDate === yesterday);
    for (const l of yLogs) {
      logFood({
        logDate: date,
        mealType: l.mealType,
        foodItemId: l.foodItemId,
        customName: l.customName,
        quantity: l.quantity,
        calories: l.calories,
        protein: l.protein,
        carbs: l.carbs,
        fat: l.fat,
        fiber: l.fiber,
        sugar: l.sugar,
        sodium: l.sodium,
        foodQualityScore: l.foodQualityScore,
        foodQualityLabel: l.foodQualityLabel,
        notes: null,
      });
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <NavHeader
        overline="Food log"
        title={isToday(date) ? "Today" : formatShort(date)}
        right={
          <div style={{ display: "flex", gap: 6 }}>
            <IconBtn onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">
              <ChevronLeft size={18} />
            </IconBtn>
            <IconBtn onClick={() => setDate(addDays(date, 1))} disabled={isToday(date)} aria-label="Next day">
              <ChevronRight size={18} />
            </IconBtn>
          </div>
        }
      />

      {/* Day totals */}
      <Card padding={16}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, textAlign: "center" }}>
          {(
            [
              ["kcal", totals.calories, data.targets?.calories],
              ["protein", totals.protein, data.targets?.protein],
              ["carbs", totals.carbs, data.targets?.carbs],
              ["fat", totals.fat, data.targets?.fat],
            ] as const
          ).map(([label, val, target]) => (
            <div key={label}>
              <div className="if-num" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24 }}>{val}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                / {target ?? "—"} {label}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {dayLogs.length === 0 && (
        <Card style={{ textAlign: "center", padding: 28 }}>
          <p style={{ margin: "0 0 14px", color: "var(--text-secondary)" }}>Nothing logged yet. Two taps and you&apos;re tracking.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Button onClick={() => setAddOpen("breakfast")} leadingIcon={<Plus size={16} />}>
              Log a meal
            </Button>
            <Button variant="secondary" onClick={copyYesterday} leadingIcon={<Copy size={15} />}>
              Copy yesterday
            </Button>
          </div>
        </Card>
      )}

      {/* Meal sections */}
      {MEAL_TYPES.map(({ value, label }) => {
        const logs = dayLogs.filter((l) => l.mealType === value);
        if (logs.length === 0 && value === "custom") return null;
        return (
          <Card key={value} padding={16}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: logs.length ? 10 : 0 }}>
              <CardTitle style={{ marginBottom: 0 }}>{label}</CardTitle>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {logs.length > 0 && (
                  <span className="if-num" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                    {Math.round(logs.reduce((s, l) => s + l.calories, 0))} kcal
                  </span>
                )}
                <IconBtn onClick={() => setAddOpen(value)} aria-label={`Add to ${label}`}>
                  <Plus size={16} />
                </IconBtn>
              </div>
            </div>
            {logs.map((l) => (
              <div
                key={l.id}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid var(--border-subtle)" }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>
                    {l.customName ?? getFoodById(l.foodItemId ?? "")?.name ?? "Food"}
                    {l.quantity !== 1 && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> ×{l.quantity}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {Math.round(l.calories)} kcal · P{Math.round(l.protein)} C{Math.round(l.carbs)} F{Math.round(l.fat)}
                    {l.notes && <> · “{l.notes}”</>}
                  </div>
                </div>
                {l.foodQualityLabel && (
                  <Pill color={TIER_COLORS[(l.foodQualityScore ?? 0) >= 85 ? "excellent" : (l.foodQualityScore ?? 0) >= 70 ? "strong" : (l.foodQualityScore ?? 0) >= 55 ? "useful" : (l.foodQualityScore ?? 0) >= 40 ? "limited" : "poor_fit"]}>
                    {l.foodQualityLabel}
                  </Pill>
                )}
                <IconBtn onClick={() => removeFoodLog(l.id)} aria-label="Remove">
                  <Trash2 size={14} />
                </IconBtn>
              </div>
            ))}
          </Card>
        );
      })}

      {dayLogs.length > 0 && (
        <Button variant="secondary" onClick={copyYesterday} leadingIcon={<Copy size={15} />}>
          Copy yesterday&apos;s meals
        </Button>
      )}

      <AddFoodModal
        key={addOpen ?? "closed"}
        open={addOpen !== null}
        mealType={addOpen ?? "snack"}
        date={date}
        dir={dir}
        onClose={() => setAddOpen(null)}
      />
    </div>
  );
}

function IconBtn({ children, disabled, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        width: 34,
        height: 34,
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border-subtle)",
        background: "var(--surface-card)",
        color: disabled ? "var(--text-muted)" : "var(--text-secondary)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        WebkitTapHighlightColor: "transparent",
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ============ Add food modal: search / frequent / manual ============ */

function AddFoodModal({
  open,
  mealType: initialMealType,
  date,
  dir,
  onClose,
}: {
  open: boolean;
  mealType: MealType;
  date: string;
  dir: ReturnType<typeof goalDirection>;
  onClose: () => void;
}) {
  const { data, logFood } = useApp();
  // The parent remounts this modal via `key` whenever it opens, so state
  // initializers double as the reset.
  const [tab, setTab] = useState<"search" | "manual">("search");
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  // manual entry
  const [mName, setMName] = useState("");
  const [mCal, setMCal] = useState("");
  const [mP, setMP] = useState("");
  const [mC, setMC] = useState("");
  const [mF, setMF] = useState("");

  const results = useMemo(() => searchSeedFoods(query).slice(0, 30), [query]);
  const frequent = data.frequentMealIds.map((id) => SEED_FOODS.find((f) => f.id === id)).filter(Boolean) as FoodItem[];

  function saveSeed() {
    if (!selected) return;
    const quality = scoreFoodForGoal(selected, dir);
    logFood({
      logDate: date,
      mealType,
      foodItemId: selected.id,
      customName: null,
      quantity: qty,
      calories: selected.calories * qty,
      protein: selected.protein * qty,
      carbs: selected.carbs * qty,
      fat: selected.fat * qty,
      fiber: selected.fiber * qty,
      sugar: selected.sugar * qty,
      sodium: selected.sodium != null ? selected.sodium * qty : null,
      foodQualityScore: quality.score,
      foodQualityLabel: quality.label,
      notes: notes || null,
    });
    onClose();
  }

  function saveManual() {
    if (!mName.trim() || !Number(mCal)) return;
    logFood({
      logDate: date,
      mealType,
      foodItemId: null,
      customName: mName.trim(),
      quantity: 1,
      calories: Number(mCal),
      protein: Number(mP) || 0,
      carbs: Number(mC) || 0,
      fat: Number(mF) || 0,
      fiber: 0,
      sugar: 0,
      sodium: null,
      foodQualityScore: null,
      foodQualityLabel: null,
      notes: notes || null,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Log food">
      <div style={{ display: "grid", gap: 14 }}>
        <SegmentedControl
          options={MEAL_TYPES.map((m) => ({ value: m.value, label: m.label.slice(0, 5) }))}
          value={mealType}
          onChange={setMealType}
        />
        <SegmentedControl
          options={[
            { value: "search", label: "Search foods" },
            { value: "manual", label: "Quick entry" },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === "search" && !selected && (
          <>
            <div style={{ position: "relative" }}>
              <Search size={17} style={{ position: "absolute", left: 14, top: 15, color: "var(--text-muted)" }} />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the food database…" style={{ paddingLeft: 42 }} />
            </div>
            {frequent.length > 0 && !query && (
              <div>
                <div className="if-overline" style={{ color: "var(--text-muted)", marginBottom: 8 }}>
                  Frequent
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {frequent.slice(0, 6).map((f) => (
                    <Chip key={f.id} label={f.name} size="sm" onClick={() => setSelected(f)} />
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "grid", gap: 6, maxHeight: 320, overflowY: "auto" }}>
              {results.map((f) => {
                const q = scoreFoodForGoal(f, dir);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelected(f)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      textAlign: "left",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--surface-card)",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{f.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {f.servingSize} {f.servingUnit} · {f.calories} kcal · P{f.protein} C{f.carbs} F{f.fat}
                      </div>
                    </div>
                    <Pill color={TIER_COLORS[q.tier]}>{q.score}</Pill>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {tab === "search" && selected && (
          <div style={{ display: "grid", gap: 14 }}>
            <div className="if-glass" style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <strong>{selected.name}</strong>
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                    per {selected.servingSize} {selected.servingUnit}
                  </div>
                </div>
                <Pill color={TIER_COLORS[scoreFoodForGoal(selected, dir).tier]}>{scoreFoodForGoal(selected, dir).label}</Pill>
              </div>
              <div className="if-num" style={{ marginTop: 10, fontSize: 14, color: "var(--text-secondary)" }}>
                {Math.round(selected.calories * qty)} kcal · P{Math.round(selected.protein * qty)} · C{Math.round(selected.carbs * qty)} · F
                {Math.round(selected.fat * qty)}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Stepper value={qty} onChange={setQty} min={0.25} max={10} step={0.25} format={(v) => `×${v}`} />
            </div>
            <Input label="Note" optional value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. post-workout" />
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="outline" onClick={() => setSelected(null)}>
                Back
              </Button>
              <Button fullWidth onClick={saveSeed}>
                Add to {mealType.replace("_", " ")}
              </Button>
            </div>
          </div>
        )}

        {tab === "manual" && (
          <div style={{ display: "grid", gap: 12 }}>
            <Input label="Name" value={mName} onChange={(e) => setMName(e.target.value)} placeholder="Chipotle bowl" />
            <Input label="Calories" type="number" value={mCal} onChange={(e) => setMCal(e.target.value)} placeholder="750" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Input label="Protein (g)" optional type="number" value={mP} onChange={(e) => setMP(e.target.value)} />
              <Input label="Carbs (g)" optional type="number" value={mC} onChange={(e) => setMC(e.target.value)} />
              <Input label="Fat (g)" optional type="number" value={mF} onChange={(e) => setMF(e.target.value)} />
            </div>
            <Textarea label="Note" optional value={notes} onChange={(e) => setNotes(e.target.value)} style={{ minHeight: 60 }} />
            <Button fullWidth onClick={saveManual} disabled={!mName.trim() || !Number(mCal)}>
              Add to {mealType.replace("_", " ")}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
