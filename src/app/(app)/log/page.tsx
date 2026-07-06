"use client";

import React, { useMemo, useState } from "react";
import {
  Barcode,
  Bookmark,
  Camera,
  ChevronLeft,
  ChevronRight,
  Copy,
  Dumbbell,
  Plus,
  Search,
  Star,
  StickyNote,
  Trash2,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip, Pill } from "@/components/ui/Chip";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Stepper } from "@/components/ui/Stepper";
import { NavHeader } from "@/components/ui/NavHeader";
import { DynIcon } from "@/components/ui/DynIcon";
import { InlineSpinner } from "@/components/ui/GeneratingOverlay";
import { BarcodeScanner } from "@/components/food-log/BarcodeScanner";
import { FoodLabel, FoodIcon, gradeFor, GradeBadge } from "@/components/food-log/FoodLabel";
import { useApp } from "@/lib/store/AppStoreProvider";
import { getFoodById } from "@/data/foods";
import { searchFoods, lookupBarcode } from "@/lib/food-db/client";
import { scoreFoodForGoal, TIER_COLORS } from "@/lib/food-quality/scoring";
import { goalDirection } from "@/lib/nutrition/calculations";
import { CORE_MEAL_ORDER, EXERCISE_TYPES, estimateCaloriesBurned, mealTypeIcon, mealTypeLabel, MEAL_TYPES } from "@/lib/constants";
import { fileToResizedDataUrl } from "@/lib/image";
import { addDays, formatShort, isToday, todayStr } from "@/lib/dates";
import type { ExerciseType, FoodItem, GoalDirection, MealType } from "@/types";

export default function LogPage() {
  const { data, logFood, removeFoodLog, addWater, logExercise, removeExercise, saveNote, noteFor, saveMeal } = useApp();
  const profile = data.profile!;
  const dir = goalDirection(profile.primaryGoal);

  const [date, setDate] = useState(todayStr());
  const [addOpen, setAddOpen] = useState<MealType | null>(null);
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  const dayLogs = data.foodLogs.filter((l) => l.logDate === date);
  const dayExercise = data.exerciseLogs.filter((e) => e.logDate === date);
  const note = noteFor(date);
  const totals = {
    calories: Math.round(dayLogs.reduce((s, l) => s + l.calories, 0)),
    protein: Math.round(dayLogs.reduce((s, l) => s + l.protein, 0)),
    carbs: Math.round(dayLogs.reduce((s, l) => s + l.carbs, 0)),
    fat: Math.round(dayLogs.reduce((s, l) => s + l.fat, 0)),
  };
  const burned = Math.round(dayExercise.reduce((s, e) => s + e.caloriesBurned, 0));
  const budget = (data.targets?.calories ?? 0) + (profile.exerciseAddsToBudget ? burned : 0);

  const usedMealTypes = CORE_MEAL_ORDER.filter((mt) => dayLogs.some((l) => l.mealType === mt));

  function copyYesterday() {
    const yLogs = data.foodLogs.filter((l) => l.logDate === addDays(date, -1));
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

  function saveMealFromSection(mt: MealType) {
    const items = dayLogs.filter((l) => l.mealType === mt);
    if (!items.length) return;
    saveMeal({
      name: `${mealTypeLabel(mt)} — ${formatShort(date)}`,
      mealType: mt,
      items: items.map((l) => ({
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
      })),
      calories: Math.round(items.reduce((s, l) => s + l.calories, 0)),
      protein: Math.round(items.reduce((s, l) => s + l.protein, 0)),
      carbs: Math.round(items.reduce((s, l) => s + l.carbs, 0)),
      fat: Math.round(items.reduce((s, l) => s + l.fat, 0)),
    });
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
              ["kcal", totals.calories, budget || data.targets?.calories],
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
        {profile.exerciseAddsToBudget && burned > 0 && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--forest-400)", textAlign: "center" }}>
            +{burned} kcal from exercise added to today&apos;s budget
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button size="sm" onClick={() => setAddOpen("snack")} leadingIcon={<Plus size={15} />}>
          Add food
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setExerciseOpen(true)} leadingIcon={<Dumbbell size={15} />}>
          Add exercise
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setNoteOpen(true)} leadingIcon={<StickyNote size={15} />}>
          {note ? "Edit note" : "Add note"}
        </Button>
        <Button size="sm" variant="ghost" onClick={copyYesterday} leadingIcon={<Copy size={14} />}>
          Copy yesterday
        </Button>
      </div>

      {dayLogs.length === 0 && (
        <Card style={{ textAlign: "center", padding: 28 }}>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>Nothing logged yet. Two taps and you&apos;re tracking.</p>
        </Card>
      )}

      {/* Meal sections */}
      {usedMealTypes.map((mt) => {
        const logs = dayLogs.filter((l) => l.mealType === mt);
        return (
          <Card key={mt} padding={16}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <DynIcon name={mealTypeIcon(mt)} size={17} color="var(--text-secondary)" />
                <CardTitle style={{ marginBottom: 0 }}>{mealTypeLabel(mt)}</CardTitle>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="if-num" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                  {Math.round(logs.reduce((s, l) => s + l.calories, 0))} kcal
                </span>
                <IconBtn onClick={() => saveMealFromSection(mt)} aria-label="Save as meal" title="Save as reusable meal">
                  <Bookmark size={15} />
                </IconBtn>
                <IconBtn onClick={() => setAddOpen(mt)} aria-label={`Add to ${mealTypeLabel(mt)}`}>
                  <Plus size={16} />
                </IconBtn>
              </div>
            </div>
            {logs.map((l) => {
              const food = l.foodItemId ? getFoodById(l.foodItemId) : undefined;
              return (
                <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid var(--border-subtle)" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, overflow: "hidden", background: "var(--surface-inset)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {l.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : food ? (
                      <FoodIcon food={food} size={20} />
                    ) : (
                      <DynIcon name="Utensils" size={18} color="var(--text-muted)" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>
                      {l.customName ?? food?.name ?? "Food"}
                      {l.quantity !== 1 && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> ×{l.quantity}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {Math.round(l.calories)} kcal · P{Math.round(l.protein)} C{Math.round(l.carbs)} F{Math.round(l.fat)}
                      {l.loggedAt && ` · ${new Date(l.loggedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
                    </div>
                  </div>
                  <IconBtn onClick={() => removeFoodLog(l.id)} aria-label="Remove">
                    <Trash2 size={14} />
                  </IconBtn>
                </div>
              );
            })}
          </Card>
        );
      })}

      {/* Exercise */}
      {dayExercise.length > 0 && (
        <Card padding={16}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Dumbbell size={17} color="var(--text-secondary)" />
              <CardTitle style={{ marginBottom: 0 }}>Exercise</CardTitle>
            </div>
            <span className="if-num" style={{ fontSize: 12.5, color: "var(--forest-400)" }}>−{burned} kcal</span>
          </div>
          {dayExercise.map((e) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid var(--border-subtle)" }}>
              <DynIcon name={EXERCISE_TYPES.find((t) => t.value === e.type)?.icon ?? "Activity"} size={18} color="var(--text-secondary)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{e.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {e.durationMinutes} min · {e.caloriesBurned} kcal
                  {e.loggedAt && ` · ${new Date(e.loggedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
                </div>
              </div>
              <IconBtn onClick={() => removeExercise(e.id)} aria-label="Remove">
                <Trash2 size={14} />
              </IconBtn>
            </div>
          ))}
        </Card>
      )}

      {/* Note */}
      {note?.body && (
        <Card padding={16} className="if-hover" onClick={() => setNoteOpen(true)} style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <StickyNote size={15} color="var(--text-secondary)" />
            <CardTitle style={{ marginBottom: 0 }}>Note</CardTitle>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", whiteSpace: "pre-line" }}>{note.body}</p>
        </Card>
      )}

      {/* Water */}
      <Card padding={16}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <CardTitle style={{ marginBottom: 0 }}>Water</CardTitle>
          <span className="if-num" style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {data.waterLogs.filter((w) => w.logDate === date).reduce((s, w) => s + w.amountOz, 0)} / {data.targets?.waterOz ?? 80} oz
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[8, 16, 24].map((oz) => (
            <Button key={oz} size="sm" variant="secondary" onClick={() => addWater(oz, date)}>
              +{oz} oz
            </Button>
          ))}
        </div>
      </Card>

      <AddFoodModal key={addOpen ?? "closed"} open={addOpen !== null} mealType={addOpen ?? "snack"} date={date} dir={dir} onClose={() => setAddOpen(null)} />
      <ExerciseModal key={exerciseOpen ? "ex-open" : "ex-closed"} open={exerciseOpen} date={date} weightLbs={profile.currentWeight ?? 170} onClose={() => setExerciseOpen(false)} onAdd={logExercise} />
      <NoteModal key={noteOpen ? `note-${note?.updatedAt ?? "open"}` : "note-closed"} open={noteOpen} initial={note?.body ?? ""} onClose={() => setNoteOpen(false)} onSave={(body) => saveNote(body, date)} />
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

/* ============ Add food modal ============ */

function AddFoodModal({ open, mealType: initialMealType, date, dir, onClose }: { open: boolean; mealType: MealType; date: string; dir: GoalDirection; onClose: () => void }) {
  const { data, logFood, logSavedMeal, toggleFavorite, isFavorite, saveRecipe, removeRecipe, logRecipe } = useApp();
  const [tab, setTab] = useState<"search" | "manual" | "saved" | "recipes">("search");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [query, setQuery] = useState("");
  const [seedResults, setSeedResults] = useState<FoodItem[]>([]);
  const [remoteResults, setRemoteResults] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);

  const [mName, setMName] = useState("");
  const [mCal, setMCal] = useState("");
  const [mP, setMP] = useState("");
  const [mC, setMC] = useState("");
  const [mF, setMF] = useState("");

  const favorites = useMemo(
    () => data.favoriteFoodIds.map((id) => (id.startsWith("off:") ? undefined : getFoodById(id))).filter(Boolean) as FoodItem[],
    [data.favoriteFoodIds],
  );

  // Debounced search: seed instantly, OFF after a beat. All state updates run
  // inside the timer callback so nothing sets state synchronously in the effect.
  React.useEffect(() => {
    let active = true;
    const t = setTimeout(
      async () => {
        if (!query.trim()) {
          setSeedResults([]);
          setRemoteResults([]);
          return;
        }
        setSearching(true);
        const { seed, remote } = await searchFoods(query);
        if (!active) return;
        setSeedResults(seed);
        setRemoteResults(remote);
        setSearching(false);
      },
      query.trim() ? 350 : 0,
    );
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

  async function onScan(code: string) {
    setScanOpen(false);
    setScanBusy(true);
    const item = await lookupBarcode(code);
    setScanBusy(false);
    if (item) {
      setSelected(item);
      setTab("search");
    } else {
      alert(`No product found for barcode ${code}. Try manual entry.`);
      setTab("manual");
    }
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPhoto(await fileToResizedDataUrl(file));
  }

  function saveSeed() {
    if (!selected) return;
    const quality = scoreFoodForGoal(selected, dir);
    logFood({
      logDate: date,
      mealType,
      foodItemId: selected.source === "open_food_facts" ? null : selected.id,
      customName: selected.source === "open_food_facts" ? selected.name : null,
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
      imageUrl: photo ?? selected.imageUrl ?? null,
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
      imageUrl: photo,
    });
    onClose();
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Log food">
        <div style={{ display: "grid", gap: 14 }}>
          <Select label="Meal" value={mealType} onChange={(e) => setMealType(e.target.value as MealType)} options={MEAL_TYPES.map((m) => ({ value: m.value, label: m.label }))} />
          <SegmentedControl
            options={[
              { value: "search", label: "Search" },
              { value: "manual", label: "Quick" },
              { value: "saved", label: "Saved" },
              { value: "recipes", label: "Recipes" },
            ]}
            value={tab}
            onChange={setTab}
          />

          {tab === "search" && !selected && (
            <>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <Search size={17} style={{ position: "absolute", left: 14, top: 15, color: "var(--text-muted)" }} />
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search foods…" style={{ paddingLeft: 42 }} />
                </div>
                <Button variant="secondary" onClick={() => setScanOpen(true)} aria-label="Scan barcode" style={{ width: 48, padding: 0 }}>
                  {scanBusy ? <InlineSpinner /> : <Barcode size={18} />}
                </Button>
              </div>

              {favorites.length > 0 && !query && (
                <div>
                  <div className="if-overline" style={{ color: "var(--text-muted)", marginBottom: 8 }}>
                    Favorites
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {favorites.slice(0, 8).map((f) => (
                      <Chip key={f.id} label={f.name} size="sm" onClick={() => setSelected(f)} />
                    ))}
                  </div>
                </div>
              )}

              {searching && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
                  <InlineSpinner size={16} /> Searching Open Food Facts…
                </div>
              )}

              <div style={{ display: "grid", gap: 6, maxHeight: 340, overflowY: "auto" }}>
                {[...seedResults, ...remoteResults].map((f) => {
                  const qr = scoreFoodForGoal(f, dir);
                  return (
                    <button key={f.id} type="button" onClick={() => setSelected(f)} className="if-hover" style={rowStyle}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", background: "var(--surface-inset)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {f.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={f.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <FoodIcon food={f} size={18} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {f.name}
                          {f.brand && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> · {f.brand}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {f.servingSize} {f.servingUnit} · {f.calories} kcal · P{f.protein}
                        </div>
                      </div>
                      <GradeBadge grade={gradeFor(f)} size={26} />
                      <Pill color={TIER_COLORS[qr.tier]}>{qr.score}</Pill>
                    </button>
                  );
                })}
                {!searching && query && seedResults.length + remoteResults.length === 0 && (
                  <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: 12 }}>
                    No matches. Try a barcode scan or Quick add.
                  </p>
                )}
              </div>
            </>
          )}

          {tab === "search" && selected && (
            <div style={{ display: "grid", gap: 14 }}>
              <FoodLabel food={selected} quantity={qty} direction={dir} />
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Stepper value={qty} onChange={setQty} min={0.25} max={20} step={0.25} format={(v) => `×${v}`} />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <label style={photoBtn}>
                  <Camera size={15} /> {photo ? "Photo added" : "Add photo"}
                  <input type="file" accept="image/*" capture="environment" onChange={onPhoto} style={{ display: "none" }} />
                </label>
                {selected.source !== "open_food_facts" && (
                  <button type="button" onClick={() => toggleFavorite(selected.id)} style={{ ...photoBtn, color: isFavorite(selected.id) ? "var(--gold-500)" : "var(--text-secondary)" }}>
                    <Star size={15} fill={isFavorite(selected.id) ? "var(--gold-500)" : "none"} /> {isFavorite(selected.id) ? "Favorited" : "Favorite"}
                  </button>
                )}
              </div>
              <Input label="Note" optional value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. post-workout" />
              <div style={{ display: "flex", gap: 10 }}>
                <Button variant="outline" onClick={() => { setSelected(null); setPhoto(null); }}>
                  Back
                </Button>
                <Button fullWidth onClick={saveSeed}>
                  Add to {mealTypeLabel(mealType)}
                </Button>
              </div>
            </div>
          )}

          {tab === "manual" && (
            <div style={{ display: "grid", gap: 12 }}>
              <Input label="Name" value={mName} onChange={(e) => setMName(e.target.value)} placeholder="Chipotle bowl" />
              <Input label="Calories" type="number" value={mCal} onChange={(e) => setMCal(e.target.value)} placeholder="750" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <Input label="Protein" optional type="number" value={mP} onChange={(e) => setMP(e.target.value)} />
                <Input label="Carbs" optional type="number" value={mC} onChange={(e) => setMC(e.target.value)} />
                <Input label="Fat" optional type="number" value={mF} onChange={(e) => setMF(e.target.value)} />
              </div>
              <label style={photoBtn}>
                <Camera size={15} /> {photo ? "Photo added" : "Add photo"}
                <input type="file" accept="image/*" capture="environment" onChange={onPhoto} style={{ display: "none" }} />
              </label>
              <Button fullWidth onClick={saveManual} disabled={!mName.trim() || !Number(mCal)}>
                Add to {mealTypeLabel(mealType)}
              </Button>
            </div>
          )}

          {tab === "saved" && (
            <div style={{ display: "grid", gap: 8 }}>
              {data.savedMeals.length === 0 ? (
                <p style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center", padding: 12 }}>
                  No saved meals yet. On any logged meal, tap the bookmark to save it as a reusable meal.
                </p>
              ) : (
                data.savedMeals.map((m) => (
                  <div key={m.id} className="if-glass" style={{ padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600 }}>{m.name}</div>
                      <div className="if-num" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {m.items.length} items · {m.calories} kcal · P{m.protein}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => { logSavedMeal(m, date); onClose(); }} leadingIcon={<Plus size={14} />}>
                      Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "recipes" && (
            <div style={{ display: "grid", gap: 8 }}>
              <Button variant="secondary" fullWidth onClick={() => setBuilderOpen(true)} leadingIcon={<Plus size={15} />}>
                New recipe
              </Button>
              {data.recipes.length === 0 ? (
                <p style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center", padding: 12 }}>
                  No recipes yet. Build one once (ingredients + servings) and log a serving anytime.
                </p>
              ) : (
                data.recipes.map((r) => (
                  <div key={r.id} className="if-glass" style={{ padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600 }}>{r.title}</div>
                      <div className="if-num" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {r.servings} servings · {r.caloriesPerServing} kcal/serving · P{r.proteinPerServing}
                      </div>
                    </div>
                    <IconBtn onClick={() => removeRecipe(r.id)} aria-label="Delete recipe">
                      <Trash2 size={14} />
                    </IconBtn>
                    <Button size="sm" onClick={() => { logRecipe(r, 1, date, mealType); onClose(); }} leadingIcon={<Plus size={14} />}>
                      Log 1
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Modal>
      <BarcodeScanner open={scanOpen} onClose={() => setScanOpen(false)} onDetected={onScan} />
      <RecipeBuilderModal open={builderOpen} dir={dir} onClose={() => setBuilderOpen(false)} onSave={saveRecipe} />
    </>
  );
}

/* ============ Recipe builder ============ */

function RecipeBuilderModal({
  open,
  dir,
  onClose,
  onSave,
}: {
  open: boolean;
  dir: GoalDirection;
  onClose: () => void;
  onSave: (r: Omit<import("@/types").Recipe, "id" | "userId">) => void;
}) {
  const [title, setTitle] = useState("");
  const [servings, setServings] = useState(4);
  const [ingredients, setIngredients] = useState<{ name: string; calories: number; protein: number; carbs: number; fat: number }[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);

  React.useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      const { seed, remote } = await searchFoods(query);
      if (active) setResults([...seed, ...remote].slice(0, 12));
    }, 350);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

  const totals = ingredients.reduce(
    (s, i) => ({ calories: s.calories + i.calories, protein: s.protein + i.protein, carbs: s.carbs + i.carbs, fat: s.fat + i.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const per = (v: number) => Math.round(v / Math.max(1, servings));
  void dir;

  function save() {
    if (!title.trim() || ingredients.length === 0) return;
    onSave({
      title: title.trim(),
      description: "",
      instructions: [],
      prepTimeMinutes: 0,
      cookTimeMinutes: 0,
      servings,
      caloriesPerServing: per(totals.calories),
      proteinPerServing: per(totals.protein),
      carbsPerServing: per(totals.carbs),
      fatPerServing: per(totals.fat),
      tags: [],
      ingredients: ingredients.map((i) => ({ name: i.name, quantity: "1 serving", groceryCategory: "other" as const })),
    });
    setTitle("");
    setServings(4);
    setIngredients([]);
    setQuery("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="New recipe">
      <div style={{ display: "grid", gap: 14 }}>
        <Input label="Recipe name" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chicken & rice meal prep" />
        <Field label="Servings this recipe makes">
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Stepper value={servings} onChange={setServings} min={1} max={20} step={1} format={(v) => String(v)} />
          </div>
        </Field>

        <div>
          <div className="if-overline" style={{ color: "var(--text-muted)", marginBottom: 8 }}>Ingredients</div>
          {ingredients.map((i, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: "1px solid var(--border-subtle)", fontSize: 13.5 }}>
              <span style={{ flex: 1 }}>{i.name}</span>
              <span className="if-num" style={{ color: "var(--text-muted)", fontSize: 12 }}>{i.calories} kcal</span>
              <IconBtn onClick={() => setIngredients(ingredients.filter((_, x) => x !== idx))} aria-label="Remove">
                <Trash2 size={13} />
              </IconBtn>
            </div>
          ))}
          <div style={{ position: "relative", marginTop: 10 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: 15, color: "var(--text-muted)" }} />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Add an ingredient…" style={{ paddingLeft: 38 }} />
          </div>
          <div style={{ display: "grid", gap: 4, marginTop: 8, maxHeight: 180, overflowY: "auto" }}>
            {results.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setIngredients([...ingredients, { name: f.name, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat }]);
                  setQuery("");
                  setResults([]);
                }}
                className="if-hover"
                style={{ ...rowStyle, padding: "8px 10px" }}
              >
                <FoodIcon food={f} size={16} />
                <span style={{ flex: 1, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</span>
                <span className="if-num" style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.calories} kcal</span>
              </button>
            ))}
          </div>
        </div>

        {ingredients.length > 0 && (
          <div className="if-glass" style={{ padding: 12 }}>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Per serving ({servings} total): <strong className="if-num">{per(totals.calories)} kcal</strong> · P{per(totals.protein)} · C{per(totals.carbs)} · F{per(totals.fat)}
            </div>
          </div>
        )}

        <Button fullWidth disabled={!title.trim() || ingredients.length === 0} onClick={save}>
          Save recipe
        </Button>
      </div>
    </Modal>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  textAlign: "left",
  padding: "10px 12px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border-subtle)",
  background: "var(--surface-card)",
  color: "var(--text-primary)",
};

const photoBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: "var(--radius-pill)",
  border: "1px solid var(--border-strong)",
  background: "var(--surface-card)",
  color: "var(--text-secondary)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

/* ============ Exercise modal ============ */

function ExerciseModal({
  open,
  date,
  weightLbs,
  onClose,
  onAdd,
}: {
  open: boolean;
  date: string;
  weightLbs: number;
  onClose: () => void;
  onAdd: (e: { logDate: string; type: ExerciseType; name: string; durationMinutes: number; caloriesBurned: number }) => void;
}) {
  const [type, setType] = useState<ExerciseType>("walk");
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [calories, setCalories] = useState("");

  const est = estimateCaloriesBurned(type, Number(minutes) || 0, weightLbs);

  return (
    <Modal open={open} onClose={onClose} title="Add exercise">
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {EXERCISE_TYPES.map((t) => (
            <Chip key={t.value} label={t.label} selected={type === t.value} onClick={() => setType(t.value)} />
          ))}
        </div>
        <Input label="Name" optional value={name} onChange={(e) => setName(e.target.value)} placeholder={EXERCISE_TYPES.find((t) => t.value === type)?.label} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Input label="Minutes" type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          <Input label="Calories burned" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder={String(est)} hint={`Est. ${est}`} />
        </div>
        <Button
          fullWidth
          disabled={!Number(minutes)}
          onClick={() => {
            onAdd({
              logDate: date,
              type,
              name: name.trim() || EXERCISE_TYPES.find((t) => t.value === type)!.label,
              durationMinutes: Number(minutes),
              caloriesBurned: Number(calories) || est,
            });
            onClose();
          }}
        >
          Add exercise
        </Button>
      </div>
    </Modal>
  );
}

/* ============ Note modal ============ */

function NoteModal({ open, initial, onClose, onSave }: { open: boolean; initial: string; onClose: () => void; onSave: (body: string) => void }) {
  const [body, setBody] = useState(initial);
  return (
    <Modal open={open} onClose={onClose} title="Daily note">
      <div style={{ display: "grid", gap: 14 }}>
        <Textarea
          label="What's worth remembering about today?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Energy, cravings, sleep, stress, how a meal sat with you…"
          style={{ minHeight: 140 }}
        />
        <Button fullWidth onClick={() => { onSave(body); onClose(); }}>
          Save note
        </Button>
      </div>
    </Modal>
  );
}
