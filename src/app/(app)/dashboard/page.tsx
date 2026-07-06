"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CalendarRange, Droplet, Flame, Footprints, Sparkles, Scale, UtensilsCrossed, X } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { RingStack } from "@/components/ui/ActivityRing";
import { MacroBar, ProgressBar } from "@/components/ui/MacroBar";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Wordmark } from "@/components/brand/Logo";
import { useApp } from "@/lib/store/AppStoreProvider";
import { buildCoachContext } from "@/lib/coach/context";
import { dailyCoachMessage } from "@/lib/coach/engine";
import { runBodyLearning } from "@/lib/body-learning/engine";
import { goalDirection, formatWeight } from "@/lib/nutrition/calculations";
import { todayStr } from "@/lib/dates";
import type { DashboardWidget } from "@/types";

const MODE_COLORS: Record<string, string> = {
  celebrate: "var(--gold-500)",
  encourage: "var(--forest-500)",
  nudge: "var(--warning-500)",
  challenge: "var(--danger-500)",
  reset: "var(--fiber-500)",
};

export default function DashboardPage() {
  const { data, todayStats, recentDays, weightTrend, addWater, setSteps, streakFor, refreshReminders, markReminderRead } = useApp();
  const profile = data.profile!;
  const stats = todayStats();
  const t = data.targets;
  const dir = goalDirection(profile.primaryGoal);
  const trend = weightTrend();
  const [stepsOpen, setStepsOpen] = useState(false);

  // Generate in-app encouragement/nudges on open (#6).
  useEffect(() => {
    refreshReminders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const coach = useMemo(() => {
    const ctx = buildCoachContext(data, recentDays(7), trend);
    return ctx ? dailyCoachMessage(ctx) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.foodLogs.length, data.waterLogs.length, data.weighIns.length, profile.coachStyle]);

  const learning = useMemo(() => {
    const ctx = buildCoachContext(data, recentDays(14), trend);
    return ctx ? runBodyLearning(ctx) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.foodLogs.length, data.weighIns.length]);

  const budget = stats.effectiveTargetCalories;
  const remaining = Math.max(0, budget - stats.calories);
  const over = stats.calories - budget;
  const loggingStreak = streakFor("logging")?.currentCount ?? 0;
  const unread = data.reminders.filter((r) => !r.read).slice(0, 3);
  const widgets = profile.dashboardWidgets?.length ? profile.dashboardWidgets : (["rings", "macros", "coach", "steps", "calories_burned", "water", "weight", "plan", "body_learning"] as DashboardWidget[]);

  const remainingLabel = dir === "gain" ? "Remaining to hit your gain target" : dir === "loss" ? "Calories remaining" : "Left in your range";
  const statusLine =
    dir === "gain"
      ? remaining > 0
        ? `You are ${remaining.toLocaleString()} under target. ${remaining > 600 ? "You need one more calorie-dense meal." : "One solid snack closes it."}`
        : "Gain target hit. Surplus secured for today."
      : dir === "loss"
        ? over > 0
          ? `${over.toLocaleString()} over target. A fact with a fix — plan a lighter dinner.`
          : `${remaining.toLocaleString()} left. Deficit intact.`
        : Math.abs(over) <= 150
          ? "Inside your range. Energy balance holding."
          : over > 0
            ? `${over.toLocaleString()} above range today.`
            : `${remaining.toLocaleString()} below range — fuel up.`;

  const todaysPlanned = data.plannedMeals.filter((m) => m.plannedDate === todayStr());

  const WIDGETS: Record<DashboardWidget, React.ReactNode> = {
    rings: (
      <Card key="rings" style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <RingStack
          size={168}
          thickness={15}
          rings={[
            { value: stats.calories / Math.max(1, budget), color: "energy" },
            { value: stats.protein / Math.max(1, stats.targetProtein), color: "protein" },
            { value: stats.waterOz / Math.max(1, stats.targetWaterOz), color: "fiber" },
          ]}
        >
          <div>
            <div className="if-num" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, lineHeight: 1 }}>
              {dir === "maintain" ? stats.calories.toLocaleString() : remaining.toLocaleString()}
            </div>
            <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{dir === "maintain" ? "kcal eaten" : "kcal left"}</div>
          </div>
        </RingStack>
        <div style={{ flex: 1, display: "grid", gap: 8 }}>
          <div>
            <div className="if-overline" style={{ color: "var(--text-muted)" }}>{remainingLabel}</div>
            <div className="if-num" style={{ fontSize: 15, marginTop: 4 }}>
              <strong>{stats.calories.toLocaleString()}</strong>
              <span style={{ color: "var(--text-muted)" }}> / {budget.toLocaleString()} kcal</span>
            </div>
          </div>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)", margin: 0 }}>{statusLine}</p>
        </div>
      </Card>
    ),
    macros: (
      <Card key="macros" style={{ display: "grid", gap: 14 }}>
        <CardTitle style={{ marginBottom: 0 }}>Macros</CardTitle>
        <MacroBar label="Protein" value={stats.protein} target={stats.targetProtein} color="protein" />
        <MacroBar label="Carbs" value={stats.carbs} target={t?.carbs ?? 0} color="carbs" />
        <MacroBar label="Fat" value={stats.fat} target={t?.fat ?? 0} color="fat" />
      </Card>
    ),
    coach: coach ? (
      <Card
        key="coach"
        style={{
          background: profile.coachStyle === "no_excuses" ? "var(--ink-900)" : "var(--glass-bg)",
          border: profile.coachStyle === "no_excuses" ? "1px solid color-mix(in srgb, var(--danger-500) 40%, transparent)" : undefined,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <CardTitle style={{ marginBottom: 0 }}>Coach</CardTitle>
          <Pill color={MODE_COLORS[coach.mode]}>{coach.mode}</Pill>
        </div>
        <p style={{ margin: 0, fontSize: 15, whiteSpace: "pre-line" }}>{coach.message}</p>
        {coach.suggestedAction && (
          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <Sparkles size={15} color="var(--forest-400)" />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--forest-400)" }}>{coach.suggestedAction}</span>
          </div>
        )}
      </Card>
    ) : null,
    steps: (
      <Card key="steps" className="if-hover" onClick={() => setStepsOpen(true)} style={{ cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Footprints size={16} color="var(--fiber-500)" />
            <CardTitle style={{ marginBottom: 0 }}>Steps</CardTitle>
          </div>
          <span className="if-num" style={{ fontSize: 13, color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--text-primary)" }}>{stats.steps.toLocaleString()}</strong> / {profile.stepsGoal.toLocaleString()}
          </span>
        </div>
        <ProgressBar value={stats.steps / Math.max(1, profile.stepsGoal)} color="fiber" height={9} />
        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 8 }}>Tap to log · Apple Health sync arrives with the mobile app</div>
      </Card>
    ),
    calories_burned: (
      <Card key="calories_burned">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Flame size={16} color="var(--warning-500)" />
            <CardTitle style={{ marginBottom: 0 }}>Calories burned</CardTitle>
          </div>
          <div className="if-num" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26 }}>{stats.caloriesBurned}</div>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
          {profile.exerciseAddsToBudget ? "Added to today's calorie budget" : "Tracked (not added to budget)"} · <Link href="/log" style={{ color: "var(--forest-400)" }}>Add exercise</Link>
        </div>
      </Card>
    ),
    water: (
      <Card key="water">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Droplet size={16} color="var(--fiber-500)" />
            <CardTitle style={{ marginBottom: 0 }}>Water</CardTitle>
          </div>
          <span className="if-num" style={{ fontSize: 13, color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--text-primary)" }}>{stats.waterOz}</strong> / {stats.targetWaterOz} oz
          </span>
        </div>
        <ProgressBar value={stats.waterOz / Math.max(1, stats.targetWaterOz)} color="fiber" height={10} />
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {[8, 16, 24].map((oz) => (
            <Button key={oz} size="sm" variant="secondary" leadingIcon={<Droplet size={14} />} onClick={() => addWater(oz)}>
              +{oz} oz
            </Button>
          ))}
        </div>
      </Card>
    ),
    weight: (
      <Card key="weight">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <CardTitle style={{ marginBottom: 6 }}>Weight</CardTitle>
            <div className="if-num" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 34, lineHeight: 1 }}>
              {trend.latestWeight ? formatWeight(trend.latestWeight, profile.measurementUnits) : "—"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              Goal: {profile.goalWeight ? formatWeight(profile.goalWeight, profile.measurementUnits) : "not set"}
              {trend.weeklyRateLbs != null && trend.entries >= 3 && <> · {trend.weeklyRateLbs > 0 ? "+" : ""}{trend.weeklyRateLbs.toFixed(1)} lb/wk</>}
            </div>
          </div>
          <Link href="/progress" style={{ textDecoration: "none" }}>
            <Button variant="outline" size="sm" leadingIcon={<Scale size={15} />}>Weigh in</Button>
          </Link>
        </div>
      </Card>
    ),
    plan: (
      <Card key="plan">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <CardTitle style={{ marginBottom: 0 }}>Today&apos;s plan</CardTitle>
          <Link href="/meal-plan" style={{ fontSize: 13, fontWeight: 600, color: "var(--forest-400)", textDecoration: "none" }}>Edit</Link>
        </div>
        {todaysPlanned.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>Nothing planned yet. A planned day is a defended day.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {todaysPlanned.map((m) => (
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ textDecoration: m.completed ? "line-through" : "none", color: m.completed ? "var(--text-muted)" : "var(--text-primary)" }}>
                  <span className="if-overline" style={{ color: "var(--text-muted)", marginRight: 8, fontSize: 10 }}>{m.mealType.replace(/_/g, " ")}</span>
                  {m.title}
                </span>
                <span className="if-num" style={{ color: "var(--text-muted)" }}>{m.calories} kcal</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    ),
    body_learning: learning ? (
      <Card key="body_learning" style={{ background: "var(--grad-navy)" }}>
        <CardTitle>Body learning</CardTitle>
        <strong style={{ fontSize: 15 }}>{learning.headline}</strong>
        <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--text-secondary)" }}>{learning.detail}</p>
      </Card>
    ) : null,
    fiber: <NutrientTile key="fiber" label="Fiber" value={stats.fiber} target={t?.fiber ?? 30} unit="g" color="fiber" />,
    sugar: <NutrientTile key="sugar" label="Sugar" value={stats.sugar} target={null} unit="g" color="carbs" />,
    sodium: <NutrientTile key="sodium" label="Sodium" value={stats.sodium} target={2300} unit="mg" color="fat" />,
    net_calories: (
      <Card key="net_calories" padding={16}>
        <CardTitle>Net calories</CardTitle>
        <div className="if-num" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30 }}>
          {(stats.calories - stats.caloriesBurned).toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>eaten {stats.calories.toLocaleString()} − burned {stats.caloriesBurned.toLocaleString()}</div>
      </Card>
    ),
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Header with logo (#11) */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Wordmark size={16} />
        {loggingStreak > 0 && (
          <Pill color="var(--gold-500)">
            <Flame size={13} /> {loggingStreak}-day streak
          </Pill>
        )}
      </header>

      <div>
        <div className="if-overline" style={{ color: "var(--forest-500)", marginBottom: 6 }}>
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </div>
        <h1 className="if-display" style={{ fontSize: 34, margin: 0 }}>
          {profile.name ? `Today, ${profile.name.split(" ")[0]}` : "Today"}
        </h1>
      </div>

      {/* In-app encouragement (#6) */}
      {unread.map((r) => (
        <Card key={r.id} className="if-fade-up" style={{ display: "flex", gap: 12, alignItems: "flex-start", border: "1px solid color-mix(in srgb, var(--forest-500) 30%, transparent)" }}>
          <Bell size={18} color="var(--forest-400)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14 }}>{r.message}</p>
            {r.actionHref && (
              <Link href={r.actionHref} style={{ fontSize: 13, fontWeight: 600, color: "var(--forest-400)", textDecoration: "none" }} onClick={() => markReminderRead(r.id)}>
                Take me there →
              </Link>
            )}
          </div>
          <button type="button" onClick={() => markReminderRead(r.id)} aria-label="Dismiss" style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </Card>
      ))}

      {/* CTAs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Link href="/log" style={{ textDecoration: "none" }}>
          <Button fullWidth leadingIcon={<UtensilsCrossed size={17} />} style={{ height: 52 }}>Log food</Button>
        </Link>
        <Link href="/coach" style={{ textDecoration: "none" }}>
          <Button fullWidth variant="secondary" leadingIcon={<Sparkles size={17} />} style={{ height: 52 }}>Ask coach</Button>
        </Link>
        <Link href="/meal-plan" style={{ textDecoration: "none" }}>
          <Button fullWidth variant="secondary" leadingIcon={<CalendarRange size={17} />} style={{ height: 52 }}>Meal plan</Button>
        </Link>
      </div>

      {/* Customizable widgets (#17) */}
      {widgets.map((w) => WIDGETS[w]).filter(Boolean)}

      <Link href="/profile" style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", textDecoration: "none" }}>
        Customize what shows here →
      </Link>

      <StepsModal key={stepsOpen ? "steps-open" : "steps-closed"} open={stepsOpen} current={stats.steps} onClose={() => setStepsOpen(false)} onSave={(s) => setSteps(s)} />
    </div>
  );
}

function NutrientTile({ label, value, target, unit, color }: { label: string; value: number; target: number | null; unit: string; color: "fiber" | "carbs" | "fat" }) {
  return (
    <Card padding={16}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <CardTitle style={{ marginBottom: 0 }}>{label}</CardTitle>
        <span className="if-num" style={{ fontSize: 13, color: "var(--text-muted)" }}>
          <strong style={{ color: "var(--text-primary)" }}>{value}</strong>
          {target ? ` / ${target}` : ""} {unit}
        </span>
      </div>
      {target && <ProgressBar value={value / target} color={color} height={8} />}
    </Card>
  );
}

function StepsModal({ open, current, onClose, onSave }: { open: boolean; current: number; onClose: () => void; onSave: (steps: number) => void }) {
  const [v, setV] = useState(String(current || ""));
  return (
    <Modal open={open} onClose={onClose} title="Log steps">
      <div style={{ display: "grid", gap: 14 }}>
        <Input label="Steps today" type="number" value={v} onChange={(e) => setV(e.target.value)} placeholder="8000" />
        <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-muted)" }}>
          Enter steps manually for now. Automatic Apple Health / Health Connect sync arrives with the native mobile app.
        </p>
        <Button fullWidth disabled={!v} onClick={() => { onSave(Number(v)); onClose(); }}>
          Save steps
        </Button>
      </div>
    </Modal>
  );
}
