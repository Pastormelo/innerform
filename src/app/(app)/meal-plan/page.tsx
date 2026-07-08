"use client";

import React, { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Pencil, Plus, ShoppingCart, Trash2, Wand2 } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip, Pill } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { GeneratingOverlay } from "@/components/ui/GeneratingOverlay";
import { NavHeader } from "@/components/ui/NavHeader";
import { useApp, uid } from "@/lib/store/AppStoreProvider";
import { templatesForGoal, type MealTemplate } from "@/data/meal-templates";
import { goalDirection } from "@/lib/nutrition/calculations";
import { addDays, formatDay, formatShort, isToday, todayStr, weekStart } from "@/lib/dates";
import type { GroceryCategory, GroceryItem, MealType, PlannedMeal } from "@/types";

const SLOTS: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
  { value: "pre_workout", label: "Pre-workout" },
  { value: "post_workout", label: "Post-workout" },
  { value: "custom", label: "Custom" },
];

type PlanMode = "auto" | "meal_prep" | "simple" | "high_calorie" | "fat_loss" | "budget";
const MODES: { value: PlanMode; label: string }[] = [
  { value: "auto", label: "Match my goal" },
  { value: "meal_prep", label: "Meal prep" },
  { value: "simple", label: "Simple meals" },
  { value: "high_calorie", label: "High-calorie" },
  { value: "fat_loss", label: "Fat-loss" },
  { value: "budget", label: "Budget" },
];

const CATEGORY_LABELS: Record<GroceryCategory, string> = {
  produce: "Produce",
  meat_seafood: "Meat & Seafood",
  dairy: "Dairy",
  grains: "Grains",
  pantry: "Pantry",
  frozen: "Frozen",
  snacks: "Snacks",
  supplements: "Supplements",
  other: "Other",
};

export default function MealPlanPage() {
  const { data, update, logFood } = useApp();
  const profile = data.profile!;
  const dir = goalDirection(profile.primaryGoal);
  const [view, setView] = useState<"plan" | "grocery">("plan");
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [wkStart, setWkStart] = useState(weekStart(todayStr()));
  const [addSlot, setAddSlot] = useState<MealType | null>(null);
  const [genOpen, setGenOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState<PlanMode>("auto");
  const [customItem, setCustomItem] = useState("");
  const [editMeal, setEditMeal] = useState<PlannedMeal | null>(null);

  function logPlanned(m: PlannedMeal, markDone = true) {
    logFood({
      logDate: m.plannedDate,
      mealType: m.mealType,
      foodItemId: null,
      customName: m.title,
      quantity: 1,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      fiber: 0,
      sugar: 0,
      sodium: null,
      foodQualityScore: null,
      foodQualityLabel: null,
      notes: "From meal plan",
    });
    if (markDone) update((d) => ({ ...d, plannedMeals: d.plannedMeals.map((x) => (x.id === m.id ? { ...x, completed: true } : x)) }));
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(wkStart, i));
  const dayMeals = data.plannedMeals
    .filter((m) => m.plannedDate === selectedDate)
    .sort((a, b) => SLOTS.findIndex((s) => s.value === a.mealType) - SLOTS.findIndex((s) => s.value === b.mealType));
  const templates = useMemo(() => templatesForGoal(dir), [dir]);
  const groceryList = data.groceryLists.find((g) => g.weekStartDate === wkStart);
  const groceryItems = groceryList ? data.groceryItems.filter((i) => i.groceryListId === groceryList.id) : [];

  function ensurePlanId(): string {
    const existing = data.mealPlans.find((p) => p.weekStartDate === wkStart);
    if (existing) return existing.id;
    const id = uid();
    update((d) => ({
      ...d,
      mealPlans: [...d.mealPlans, { id, userId: profile.authUserId, weekStartDate: wkStart, title: `Week of ${formatShort(wkStart)}`, notes: null }],
    }));
    return id;
  }

  function addFromTemplate(t: MealTemplate, date: string, slot?: MealType) {
    const planId = ensurePlanId();
    const meal: PlannedMeal = {
      id: uid(),
      userId: profile.authUserId,
      mealPlanId: planId,
      plannedDate: date,
      mealType: slot ?? t.mealType,
      title: t.title,
      description: t.description,
      calories: t.calories,
      protein: t.protein,
      carbs: t.carbs,
      fat: t.fat,
      recipeId: null,
      completed: false,
    };
    update((d) => ({ ...d, plannedMeals: [...d.plannedMeals, meal] }));
    setAddSlot(null);
  }

  /** Mock AI meal-plan generator — fills the week from goal/mode-filtered templates. */
  function generateWeek() {
    const pool = (() => {
      let p = templates;
      if (mode === "high_calorie") p = templatesForGoal("gain");
      if (mode === "fat_loss") p = templatesForGoal("loss");
      if (mode === "simple") p = p.filter((t) => !t.tags.includes("full day"));
      if (mode === "budget") p = p.filter((t) => t.groceries.length <= 4 || t.tags.includes("balanced"));
      return p;
    })();
    const pick = (slot: MealType, i: number) => {
      const fits = pool.filter((t) => t.mealType === slot);
      return fits.length ? fits[i % fits.length] : null;
    };
    const planId = ensurePlanId();
    const meals: PlannedMeal[] = [];
    weekDays.forEach((date, i) => {
      (["breakfast", "lunch", "dinner", "snack"] as MealType[]).forEach((slot) => {
        const t = pick(slot, mode === "meal_prep" ? Math.floor(i / 3) : i); // meal prep repeats meals in blocks
        if (t)
          meals.push({
            id: uid(),
            userId: profile.authUserId,
            mealPlanId: planId,
            plannedDate: date,
            mealType: slot,
            title: t.title,
            description: t.description,
            calories: t.calories,
            protein: t.protein,
            carbs: t.carbs,
            fat: t.fat,
            recipeId: null,
            completed: false,
          });
      });
    });
    setGenOpen(false);
    setGenerating(true);
    setTimeout(() => {
      update((d) => ({
        ...d,
        plannedMeals: [...d.plannedMeals.filter((m) => !(m.plannedDate >= wkStart && m.plannedDate <= addDays(wkStart, 6))), ...meals],
      }));
      setGenerating(false);
    }, 8000);
  }

  function generateGroceries() {
    const weekMeals = data.plannedMeals.filter((m) => m.plannedDate >= wkStart && m.plannedDate <= addDays(wkStart, 6));
    const listId = groceryList?.id ?? uid();
    const seen = new Map<string, GroceryItem>();
    for (const m of weekMeals) {
      const t = templates.find((x) => x.title === m.title) ?? templatesForGoal("gain").find((x) => x.title === m.title) ?? templatesForGoal("loss").find((x) => x.title === m.title);
      for (const g of t?.groceries ?? []) {
        const key = g.name.toLowerCase();
        if (!seen.has(key))
          seen.set(key, { id: uid(), groceryListId: listId, name: g.name, category: g.category, quantity: g.quantity, checked: false });
      }
    }
    update((d) => ({
      ...d,
      groceryLists: groceryList
        ? d.groceryLists
        : [...d.groceryLists, { id: listId, userId: profile.authUserId, title: `Groceries — week of ${formatShort(wkStart)}`, weekStartDate: wkStart }],
      groceryItems: [...d.groceryItems.filter((i) => i.groceryListId !== listId), ...seen.values()],
    }));
    setView("grocery");
  }

  function addCustomGrocery() {
    if (!customItem.trim()) return;
    const listId = groceryList?.id ?? uid();
    const item: GroceryItem = { id: uid(), groceryListId: listId, name: customItem.trim(), category: "other", quantity: "", checked: false };
    update((d) => ({
      ...d,
      groceryLists: groceryList
        ? d.groceryLists
        : [...d.groceryLists, { id: listId, userId: profile.authUserId, title: `Groceries — week of ${formatShort(wkStart)}`, weekStartDate: wkStart }],
      groceryItems: [...d.groceryItems, item],
    }));
    setCustomItem("");
  }

  const dayTotal = dayMeals.reduce((s, m) => s + m.calories, 0);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <NavHeader overline="Meal plan" title={view === "plan" ? "This week" : "Groceries"} />

      <SegmentedControl
        options={[
          { value: "plan", label: "Meal plan" },
          { value: "grocery", label: `Grocery list${groceryItems.length ? ` (${groceryItems.filter((i) => !i.checked).length})` : ""}` },
        ]}
        value={view}
        onChange={setView}
      />

      {view === "plan" && (
        <>
          {/* Week selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <WeekBtn onClick={() => setWkStart(addDays(wkStart, -7))}>
              <ChevronLeft size={16} />
            </WeekBtn>
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {weekDays.map((d) => {
                const active = d === selectedDate;
                const hasMeals = data.plannedMeals.some((m) => m.plannedDate === d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    style={{
                      padding: "8px 0 6px",
                      borderRadius: "var(--radius-sm)",
                      border: `1px solid ${active ? "var(--forest-500)" : "var(--border-subtle)"}`,
                      background: active ? "color-mix(in srgb, var(--forest-500) 15%, transparent)" : "var(--surface-card)",
                      color: isToday(d) ? "var(--forest-400)" : "var(--text-secondary)",
                      cursor: "pointer",
                      textAlign: "center",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{formatDay(d)}</div>
                    <div className="if-num" style={{ fontSize: 15, fontWeight: 700 }}>{Number(d.slice(8))}</div>
                    <div style={{ height: 4 }}>{hasMeals && <span style={{ display: "inline-block", width: 4, height: 4, borderRadius: 2, background: "var(--forest-500)" }} />}</div>
                  </button>
                );
              })}
            </div>
            <WeekBtn onClick={() => setWkStart(addDays(wkStart, 7))}>
              <ChevronRight size={16} />
            </WeekBtn>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Button fullWidth leadingIcon={<Wand2 size={16} />} onClick={() => setGenOpen(true)}>
              Generate plan
            </Button>
            <Button fullWidth variant="secondary" leadingIcon={<ShoppingCart size={16} />} onClick={generateGroceries}>
              Build grocery list
            </Button>
          </div>

          {/* Day plan */}
          <Card padding={16}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <CardTitle style={{ marginBottom: 0 }}>{isToday(selectedDate) ? "Today" : formatShort(selectedDate)}</CardTitle>
              {dayTotal > 0 && (
                <span className="if-num" style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {dayTotal.toLocaleString()} kcal planned
                </span>
              )}
            </div>
            {dayMeals.length === 0 && (
              <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--text-muted)" }}>
                No meals planned. {dir === "gain" ? "A hard gainer without a plan is 700 calories short by dinner." : "Unplanned days drift. Planned days deliver."}
              </p>
            )}
            <div style={{ display: "grid", gap: 10 }}>
              {dayMeals.map((m) => (
                <div key={m.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderTop: "1px solid var(--border-subtle)" }}>
                  <button
                    type="button"
                    onClick={() => update((d) => ({ ...d, plannedMeals: d.plannedMeals.map((x) => (x.id === m.id ? { ...x, completed: !x.completed } : x)) }))}
                    aria-label="Toggle complete"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 8,
                      flexShrink: 0,
                      marginTop: 2,
                      border: `1.5px solid ${m.completed ? "var(--forest-500)" : "var(--border-strong)"}`,
                      background: m.completed ? "var(--forest-500)" : "transparent",
                      color: "var(--ink-950)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    {m.completed && <Check size={15} strokeWidth={3} />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="if-overline" style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>
                      {m.mealType.replace(/_/g, " ")}
                    </div>
                    {/* Tap the title to edit the meal */}
                    <button
                      type="button"
                      onClick={() => setEditMeal(m)}
                      style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text-primary)", textAlign: "left" }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 600, textDecoration: m.completed ? "line-through" : "none" }}>{m.title}</span>
                      <Pencil size={12} color="var(--text-muted)" />
                    </button>
                    {m.description && <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{m.description}</div>}
                    <div className="if-num" style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                      {m.calories} kcal · P{m.protein} C{m.carbs} F{m.fat}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <Button size="sm" onClick={() => logPlanned(m)} leadingIcon={<Plus size={13} />}>
                        Log now
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditMeal(m)}>
                        Edit
                      </Button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => update((d) => ({ ...d, plannedMeals: d.plannedMeals.filter((x) => x.id !== m.id) }))}
                    aria-label="Remove"
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
              {SLOTS.map((s) => (
                <Chip key={s.value} label={`+ ${s.label}`} size="sm" onClick={() => setAddSlot(s.value)} />
              ))}
            </div>
          </Card>

          {/* Template library */}
          <Card padding={16}>
            <CardTitle>{dir === "gain" ? "Hard-gainer templates" : dir === "loss" ? "Fat-loss templates" : "Templates"}</CardTitle>
            <div style={{ display: "grid", gap: 8 }}>
              {templates.slice(0, 6).map((t) => (
                <div key={t.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--border-subtle)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{t.title}</div>
                    <div className="if-num" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {t.calories} kcal · P{t.protein}
                    </div>
                  </div>
                  <Pill color="var(--fiber-500)">{t.tags[0]}</Pill>
                  <Button size="sm" variant="secondary" onClick={() => addFromTemplate(t, selectedDate)} leadingIcon={<Plus size={13} />}>
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {view === "grocery" && (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            <Input value={customItem} onChange={(e) => setCustomItem(e.target.value)} placeholder="Add item…" onKeyDown={(e) => e.key === "Enter" && addCustomGrocery()} />
            <Button onClick={addCustomGrocery} leadingIcon={<Plus size={16} />}>
              Add
            </Button>
          </div>
          {groceryItems.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 28 }}>
              <p style={{ margin: "0 0 14px", color: "var(--text-secondary)" }}>No list yet. Build it from your meal plan in one tap.</p>
              <Button onClick={generateGroceries} leadingIcon={<ShoppingCart size={16} />}>
                Generate from meal plan
              </Button>
            </Card>
          ) : (
            <>
              {(Object.keys(CATEGORY_LABELS) as GroceryCategory[]).map((cat) => {
                const items = groceryItems.filter((i) => i.category === cat);
                if (!items.length) return null;
                return (
                  <Card key={cat} padding={16}>
                    <CardTitle>{CATEGORY_LABELS[cat]}</CardTitle>
                    <div style={{ display: "grid", gap: 4 }}>
                      {items.map((i) => (
                        <GroceryRow
                          key={i.id}
                          item={i}
                          onToggle={() => update((d) => ({ ...d, groceryItems: d.groceryItems.map((x) => (x.id === i.id ? { ...x, checked: !x.checked } : x)) }))}
                          onDelete={() => update((d) => ({ ...d, groceryItems: d.groceryItems.filter((x) => x.id !== i.id) }))}
                        />
                      ))}
                    </div>
                  </Card>
                );
              })}
              {groceryItems.some((i) => i.checked) && (
                <Button
                  variant="outline"
                  onClick={() => update((d) => ({ ...d, groceryItems: d.groceryItems.filter((i) => !(i.groceryListId === groceryList?.id && i.checked)) }))}
                >
                  Clear purchased items
                </Button>
              )}
            </>
          )}
        </>
      )}

      {/* Add-to-slot modal */}
      <Modal open={addSlot !== null} onClose={() => setAddSlot(null)} title={`Add ${addSlot?.replace("_", " ") ?? ""}`}>
        <div style={{ display: "grid", gap: 8 }}>
          {templates
            .filter((t) => addSlot === "custom" || t.mealType === addSlot || t.mealType === "snack")
            .map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => addFromTemplate(t, selectedDate, addSlot ?? undefined)}
                className="if-glass"
                style={{ textAlign: "left", padding: 14, cursor: "pointer", color: "var(--text-primary)", border: "1px solid var(--glass-border)" }}
              >
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{t.title}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{t.description}</div>
                <div className="if-num" style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                  {t.calories} kcal · P{t.protein} C{t.carbs} F{t.fat}
                </div>
              </button>
            ))}
        </div>
      </Modal>

      {/* Edit a planned meal + log from here */}
      <PlannedMealEditor
        key={editMeal?.id ?? "no-edit"}
        meal={editMeal}
        onClose={() => setEditMeal(null)}
        onSave={(patch) => {
          if (!editMeal) return;
          update((d) => ({ ...d, plannedMeals: d.plannedMeals.map((x) => (x.id === editMeal.id ? { ...x, ...patch } : x)) }));
          setEditMeal(null);
        }}
        onLog={(patch) => {
          if (!editMeal) return;
          const merged = { ...editMeal, ...patch };
          update((d) => ({ ...d, plannedMeals: d.plannedMeals.map((x) => (x.id === editMeal.id ? merged : x)) }));
          logPlanned(merged);
          setEditMeal(null);
        }}
      />

      <GeneratingOverlay
        key={generating ? "gen-on" : "gen-off"}
        open={generating}
        steps={[
          "Reading your goal & preferences…",
          `Applying ${MODES.find((m) => m.value === mode)?.label ?? "your"} mode…`,
          "Choosing meals that fit your macros…",
          "Balancing the week…",
          "Laying out your plan…",
        ]}
      />

      {/* Generate modal */}
      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="Generate week">
        <div style={{ display: "grid", gap: 14 }}>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>
            Fills the week with templates matched to your goal ({profile.primaryGoal.replace(/_/g, " ")}), diet, and budget. Existing
            meals this week are replaced. (AI generation plugs in here later — same interface.)
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {MODES.map((m) => (
              <Chip key={m.value} label={m.label} selected={mode === m.value} onClick={() => setMode(m.value)} />
            ))}
          </div>
          <Button fullWidth onClick={generateWeek} leadingIcon={<Wand2 size={16} />}>
            Generate
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function WeekBtn({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      style={{
        width: 30,
        height: 56,
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border-subtle)",
        background: "var(--surface-card)",
        color: "var(--text-secondary)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ============ Edit a planned meal (rename + macros) and log it ============ */

function PlannedMealEditor({
  meal,
  onClose,
  onSave,
  onLog,
}: {
  meal: PlannedMeal | null;
  onClose: () => void;
  onSave: (patch: Partial<PlannedMeal>) => void;
  onLog: (patch: Partial<PlannedMeal>) => void;
}) {
  const [title, setTitle] = useState(meal?.title ?? "");
  const [description, setDescription] = useState(meal?.description ?? "");
  const [calories, setCalories] = useState(String(meal?.calories ?? ""));
  const [protein, setProtein] = useState(String(meal?.protein ?? ""));
  const [carbs, setCarbs] = useState(String(meal?.carbs ?? ""));
  const [fat, setFat] = useState(String(meal?.fat ?? ""));

  if (!meal) return null;

  const patch = (): Partial<PlannedMeal> => ({
    title: title.trim() || meal.title,
    description: description.trim() || null,
    calories: Number(calories) || 0,
    protein: Number(protein) || 0,
    carbs: Number(carbs) || 0,
    fat: Number(fat) || 0,
  });

  return (
    <Modal open onClose={onClose} title="Edit meal">
      <div style={{ display: "grid", gap: 12 }}>
        <Input label="Meal name" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Description" optional value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input label="Calories" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Input label="Protein" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} />
          <Input label="Carbs" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
          <Input label="Fat" type="number" value={fat} onChange={(e) => setFat(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="outline" onClick={() => onSave(patch())}>
            Save changes
          </Button>
          <Button fullWidth onClick={() => onLog(patch())} leadingIcon={<Plus size={15} />}>
            Save &amp; log it
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ============ Grocery row: tap to check, swipe-left or trash to delete ============ */

function GroceryRow({ item, onToggle, onDelete }: { item: GroceryItem; onToggle: () => void; onDelete: () => void }) {
  const [dx, setDx] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const startX = React.useRef(0);

  return (
    <div style={{ position: "relative", overflow: "hidden", borderTop: "1px solid var(--border-subtle)" }}>
      {/* delete zone revealed behind the row on swipe */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 14, background: "var(--danger-500)" }}>
        <Trash2 size={16} color="#fff" />
      </div>
      <div
        onTouchStart={(e) => {
          startX.current = e.touches[0].clientX;
          setDragging(true);
        }}
        onTouchMove={(e) => {
          if (!dragging) return;
          const delta = e.touches[0].clientX - startX.current;
          setDx(Math.min(0, Math.max(-88, delta)));
        }}
        onTouchEnd={() => {
          setDragging(false);
          if (dx <= -56) onDelete();
          else setDx(0);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 4px",
          background: "var(--surface-app)",
          transform: `translateX(${dx}px)`,
          transition: dragging ? "none" : "transform var(--dur-base) var(--ease-out)",
        }}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-label="Toggle purchased"
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            flexShrink: 0,
            border: `1.5px solid ${item.checked ? "var(--forest-500)" : "var(--border-strong)"}`,
            background: item.checked ? "var(--forest-500)" : "transparent",
            color: "var(--ink-950)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          {item.checked && <Check size={13} strokeWidth={3} />}
        </button>
        <button
          type="button"
          onClick={onToggle}
          style={{ flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <span style={{ fontSize: 14.5, textDecoration: item.checked ? "line-through" : "none", color: item.checked ? "var(--text-muted)" : "var(--text-primary)" }}>
            {item.name}
          </span>
          {item.quantity && <span style={{ fontSize: 12.5, color: "var(--text-muted)", marginLeft: 8 }}>{item.quantity}</span>}
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete item"
          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4, flexShrink: 0 }}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
