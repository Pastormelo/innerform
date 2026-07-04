"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Droplet, Flame, Sparkles, UtensilsCrossed, CalendarRange, Scale } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { RingStack } from "@/components/ui/ActivityRing";
import { MacroBar, ProgressBar } from "@/components/ui/MacroBar";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Chip";
import { useApp } from "@/lib/store/AppStoreProvider";
import { buildCoachContext } from "@/lib/coach/context";
import { dailyCoachMessage } from "@/lib/coach/engine";
import { runBodyLearning } from "@/lib/body-learning/engine";
import { goalDirection, formatWeight } from "@/lib/nutrition/calculations";
import { todayStr } from "@/lib/dates";

const MODE_COLORS: Record<string, string> = {
  celebrate: "var(--gold-500)",
  encourage: "var(--forest-500)",
  nudge: "var(--warning-500)",
  challenge: "var(--danger-500)",
  reset: "var(--fiber-500)",
};

export default function DashboardPage() {
  const { data, todayStats, recentDays, weightTrend, addWater, streakFor } = useApp();
  const profile = data.profile!;
  const stats = todayStats();
  const t = data.targets;
  const dir = goalDirection(profile.primaryGoal);
  const trend = weightTrend();

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

  const remaining = Math.max(0, stats.targetCalories - stats.calories);
  const over = stats.calories - stats.targetCalories;
  const loggingStreak = streakFor("logging")?.currentCount ?? 0;

  const remainingLabel =
    dir === "gain"
      ? "Remaining to hit your gain target"
      : dir === "loss"
        ? "Calories remaining"
        : "Left in your range";

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

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div className="if-overline" style={{ color: "var(--forest-500)", marginBottom: 6 }}>
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <h1 className="if-display" style={{ fontSize: 34, margin: 0 }}>
            {profile.name ? `Today, ${profile.name.split(" ")[0]}` : "Today"}
          </h1>
        </div>
        {loggingStreak > 0 && (
          <Pill color="var(--gold-500)">
            <Flame size={13} /> {loggingStreak}-day streak
          </Pill>
        )}
      </header>

      {/* Rings hero */}
      <Card style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <RingStack
          size={168}
          thickness={15}
          rings={[
            { value: stats.calories / Math.max(1, stats.targetCalories), color: "energy" },
            { value: stats.protein / Math.max(1, stats.targetProtein), color: "protein" },
            { value: stats.waterOz / Math.max(1, stats.targetWaterOz), color: "fiber" },
          ]}
        >
          <div>
            <div className="if-num" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, lineHeight: 1 }}>
              {dir === "gain" ? remaining.toLocaleString() : dir === "loss" ? remaining.toLocaleString() : stats.calories.toLocaleString()}
            </div>
            <div style={{ fontSize: 10.5, color: "var(--text-muted)", maxWidth: 80 }}>
              {dir === "maintain" ? "kcal eaten" : "kcal left"}
            </div>
          </div>
        </RingStack>
        <div style={{ flex: 1, display: "grid", gap: 8 }}>
          <div>
            <div className="if-overline" style={{ color: "var(--text-muted)" }}>{remainingLabel}</div>
            <div className="if-num" style={{ fontSize: 15, marginTop: 4 }}>
              <strong>{stats.calories.toLocaleString()}</strong>
              <span style={{ color: "var(--text-muted)" }}> / {stats.targetCalories.toLocaleString()} kcal</span>
            </div>
          </div>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)", margin: 0 }}>{statusLine}</p>
        </div>
      </Card>

      {/* Macros */}
      <Card style={{ display: "grid", gap: 14 }}>
        <CardTitle style={{ marginBottom: 0 }}>Macros</CardTitle>
        <MacroBar label="Protein" value={stats.protein} target={stats.targetProtein} color="protein" />
        <MacroBar label="Carbs" value={stats.carbs} target={t?.carbs ?? 0} color="carbs" />
        <MacroBar label="Fat" value={stats.fat} target={t?.fat ?? 0} color="fat" />
      </Card>

      {/* Coach message of the day */}
      {coach && (
        <Card
          style={{
            borderLeft: "none",
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
      )}

      {/* CTAs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Link href="/log" style={{ textDecoration: "none" }}>
          <Button fullWidth leadingIcon={<UtensilsCrossed size={17} />} style={{ height: 52 }}>
            Log food
          </Button>
        </Link>
        <Link href="/coach" style={{ textDecoration: "none" }}>
          <Button fullWidth variant="secondary" leadingIcon={<Sparkles size={17} />} style={{ height: 52 }}>
            Ask coach
          </Button>
        </Link>
        <Link href="/meal-plan" style={{ textDecoration: "none" }}>
          <Button fullWidth variant="secondary" leadingIcon={<CalendarRange size={17} />} style={{ height: 52 }}>
            Meal plan
          </Button>
        </Link>
      </div>

      {/* Water */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <CardTitle style={{ marginBottom: 0 }}>Water</CardTitle>
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
        {(streakFor("water")?.currentCount ?? 0) > 1 && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--gold-500)", fontWeight: 600 }}>
            {streakFor("water")!.currentCount}-day hydration streak
          </div>
        )}
      </Card>

      {/* Weight */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <CardTitle style={{ marginBottom: 6 }}>Weight</CardTitle>
            <div className="if-num" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 34, lineHeight: 1 }}>
              {trend.latestWeight ? formatWeight(trend.latestWeight, profile.measurementUnits) : "—"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              Goal: {profile.goalWeight ? formatWeight(profile.goalWeight, profile.measurementUnits) : "not set"}
              {trend.weeklyRateLbs != null && trend.entries >= 3 && (
                <> · trend {trend.weeklyRateLbs > 0 ? "+" : ""}{trend.weeklyRateLbs.toFixed(1)} lb/wk</>
              )}
            </div>
          </div>
          <Link href="/progress" style={{ textDecoration: "none" }}>
            <Button variant="outline" size="sm" leadingIcon={<Scale size={15} />}>
              Weigh in
            </Button>
          </Link>
        </div>
      </Card>

      {/* Today's plan */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <CardTitle style={{ marginBottom: 0 }}>Today&apos;s plan</CardTitle>
          <Link href="/meal-plan" style={{ fontSize: 13, fontWeight: 600, color: "var(--forest-400)", textDecoration: "none" }}>
            Edit
          </Link>
        </div>
        {todaysPlanned.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>
            Nothing planned yet. A planned day is a defended day — build tomorrow before it builds you.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {todaysPlanned.map((m) => (
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ textDecoration: m.completed ? "line-through" : "none", color: m.completed ? "var(--text-muted)" : "var(--text-primary)" }}>
                  <span className="if-overline" style={{ color: "var(--text-muted)", marginRight: 8, fontSize: 10 }}>
                    {m.mealType.replace("_", " ")}
                  </span>
                  {m.title}
                </span>
                <span className="if-num" style={{ color: "var(--text-muted)" }}>{m.calories} kcal</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Body learning insight */}
      {learning && (
        <Card style={{ background: "var(--grad-navy)" }}>
          <CardTitle>Body learning</CardTitle>
          <strong style={{ fontSize: 15 }}>{learning.headline}</strong>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--text-secondary)" }}>{learning.detail}</p>
        </Card>
      )}
    </div>
  );
}
