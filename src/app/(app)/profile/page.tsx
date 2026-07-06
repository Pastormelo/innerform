"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Camera, Heart, LayoutGrid, LogOut, ShieldAlert, Smartphone, Watch, Scale as ScaleIcon, User } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip, Pill } from "@/components/ui/Chip";
import { Input, Select, Field } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Switch } from "@/components/ui/Switch";
import { NavHeader } from "@/components/ui/NavHeader";
import { useApp } from "@/lib/store/AppStoreProvider";
import { applyTheme, THEME_LABELS } from "@/lib/theme";
import { formatHeight, formatWeight } from "@/lib/nutrition/calculations";
import { DAY_NAMES } from "@/lib/constants";
import { DEFAULT_WIDGETS } from "@/types";
import type { ActivityLevel, CoachStyle, DashboardWidget, DesiredPace, GoalType, HealthProvider, Theme, Units } from "@/types";

const WIDGET_LABELS: Record<DashboardWidget, string> = {
  rings: "Calorie & macro rings",
  macros: "Macro bars",
  coach: "Coach message",
  water: "Water",
  weight: "Weight",
  steps: "Steps",
  calories_burned: "Calories burned",
  plan: "Today's plan",
  body_learning: "Body learning insight",
  fiber: "Fiber",
  sugar: "Sugar",
  sodium: "Sodium",
  net_calories: "Net calories",
};
const ALL_WIDGETS = Object.keys(WIDGET_LABELS) as DashboardWidget[];

const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
  { value: "lose_weight", label: "Lose weight" },
  { value: "gain_weight", label: "Gain weight" },
  { value: "maintain_weight", label: "Maintain weight" },
  { value: "body_recomposition", label: "Body recomposition" },
  { value: "build_muscle", label: "Build muscle" },
  { value: "improve_food_quality", label: "Improve food quality" },
  { value: "improve_consistency", label: "Improve consistency" },
  { value: "improve_meal_prep", label: "Improve meal prep" },
  { value: "improve_energy", label: "Improve energy" },
  { value: "improve_confidence", label: "Improve confidence" },
  { value: "improve_discipline", label: "Improve discipline" },
];

const INTEGRATIONS: { provider: HealthProvider; label: string; Icon: React.ElementType }[] = [
  { provider: "apple_health", label: "Apple Health", Icon: Heart },
  { provider: "health_connect", label: "Health Connect", Icon: Smartphone },
  { provider: "fitbit", label: "Fitbit", Icon: Activity },
  { provider: "garmin", label: "Garmin", Icon: Watch },
  { provider: "smart_scale", label: "Smart scale", Icon: ScaleIcon },
];

export default function ProfilePage() {
  const { data, saveProfile, signOut, user, supabaseMode, setTheme, setDashboardWidgets } = useApp();
  const router = useRouter();
  const profile = data.profile!;
  const [confirmNE, setConfirmNE] = useState<0 | 1 | 2>(0);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const { fileToResizedDataUrl } = await import("@/lib/image");
    const url = await fileToResizedDataUrl(file, 240);
    saveProfile({ photoUrl: url });
  }

  function toggleWidget(w: DashboardWidget) {
    const current = profile.dashboardWidgets ?? DEFAULT_WIDGETS;
    setDashboardWidgets(current.includes(w) ? current.filter((x) => x !== w) : [...current, w]);
  }

  function toggleWeighDay(day: number) {
    const s = profile.weighInSchedule;
    const days = s.days.includes(day) ? s.days.filter((d) => d !== day) : [...s.days, day].sort();
    saveProfile({ weighInSchedule: { ...s, days } });
  }

  function setCoach(style: CoachStyle) {
    if (style === "no_excuses" && profile.coachStyle !== "no_excuses") {
      setConfirmNE(1);
      return;
    }
    saveProfile({ coachStyle: style });
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <NavHeader overline="Profile" title={profile.name || "You"} />

      {/* Identity: photo + name + edit (#8) */}
      <Card padding={16}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <label style={{ cursor: "pointer", position: "relative" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                overflow: "hidden",
                background: "var(--surface-inset)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {profile.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <User size={30} color="var(--text-muted)" />
              )}
            </div>
            <span
              style={{
                position: "absolute",
                right: -2,
                bottom: -2,
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "var(--forest-500)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ink-950)",
              }}
            >
              <Camera size={14} />
            </span>
            <input type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />
          </label>
          <div style={{ flex: 1, display: "grid", gap: 8 }}>
            <Input
              defaultValue={profile.name}
              onBlur={(e) => e.target.value.trim() && saveProfile({ name: e.target.value.trim() })}
              placeholder="Your name"
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Input type="number" defaultValue={profile.age ?? ""} onBlur={(e) => Number(e.target.value) && saveProfile({ age: Number(e.target.value) })} placeholder="Age" />
              <Select
                value={profile.sex ?? "male"}
                onChange={(e) => saveProfile({ sex: e.target.value as "male" | "female" })}
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Appearance + preferences (#18 #19 #20 #12) */}
      <Card padding={16}>
        <CardTitle>Appearance & preferences</CardTitle>
        <Field label="Theme">
          <SegmentedControl
            options={(["basic", "light", "dark"] as Theme[]).map((t) => ({ value: t, label: THEME_LABELS[t] }))}
            value={profile.theme}
            onChange={(t) => {
              applyTheme(t);
              setTheme(t);
            }}
          />
        </Field>
        <div style={{ height: 12 }} />
        <Field label="Units">
          <SegmentedControl
            options={[
              { value: "imperial", label: "lb / ft" },
              { value: "metric", label: "kg / cm" },
            ]}
            value={profile.measurementUnits}
            onChange={(u) => saveProfile({ measurementUnits: u as Units })}
          />
        </Field>
        <div style={{ height: 16 }} />
        <Input
          label="Daily step goal"
          type="number"
          defaultValue={profile.stepsGoal}
          onBlur={(e) => Number(e.target.value) && saveProfile({ stepsGoal: Number(e.target.value) })}
        />
        <div style={{ height: 16 }} />
        <div style={{ display: "grid", gap: 14 }}>
          <Switch
            label="Exercise adds to my calorie budget"
            checked={profile.exerciseAddsToBudget}
            onChange={(v) => saveProfile({ exerciseAddsToBudget: v })}
          />
          <Switch
            label="Timestamp food & exercise automatically"
            checked={profile.timestampsEnabled}
            onChange={(v) => saveProfile({ timestampsEnabled: v })}
          />
        </div>
      </Card>

      {/* Scheduled weigh-ins (#5) */}
      <Card padding={16}>
        <CardTitle>Scheduled weigh-ins</CardTitle>
        <Switch label="Remind me to weigh in" checked={profile.weighInSchedule.enabled} onChange={(v) => saveProfile({ weighInSchedule: { ...profile.weighInSchedule, enabled: v } })} />
        {profile.weighInSchedule.enabled && (
          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>Which days?</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DAY_NAMES.map((d, i) => (
                  <Chip key={d} label={d} size="sm" selected={profile.weighInSchedule.days.includes(i)} onClick={() => toggleWeighDay(i)} />
                ))}
              </div>
            </div>
            <Input
              label="Time"
              type="time"
              value={profile.weighInSchedule.time}
              onChange={(e) => saveProfile({ weighInSchedule: { ...profile.weighInSchedule, time: e.target.value } })}
            />
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
              You&apos;ll get an in-app nudge on scheduled days. Real push notifications arrive with the native mobile app.
            </p>
          </div>
        )}
      </Card>

      {/* Dashboard customization (#17) */}
      <Card padding={16}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <LayoutGrid size={16} color="var(--text-secondary)" />
          <CardTitle style={{ marginBottom: 0 }}>Today dashboard</CardTitle>
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-muted)" }}>Pick what shows on your Today screen.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ALL_WIDGETS.map((w) => (
            <Chip key={w} label={WIDGET_LABELS[w]} size="sm" selected={(profile.dashboardWidgets ?? DEFAULT_WIDGETS).includes(w)} onClick={() => toggleWidget(w)} />
          ))}
        </div>
      </Card>

      {/* Body stats */}
      <Card padding={16}>
        <CardTitle>Body</CardTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input
            label={`Current weight (${profile.measurementUnits === "imperial" ? "lb" : "kg"})`}
            type="number"
            defaultValue={profile.currentWeight ?? ""}
            onBlur={(e) => {
              const v = Number(e.target.value);
              if (v > 50) saveProfile({ currentWeight: profile.measurementUnits === "metric" ? v * 2.20462 : v });
            }}
          />
          <Input
            label={`Goal weight (${profile.measurementUnits === "imperial" ? "lb" : "kg"})`}
            type="number"
            defaultValue={profile.goalWeight ?? ""}
            onBlur={(e) => {
              const v = Number(e.target.value);
              if (v > 50) saveProfile({ goalWeight: profile.measurementUnits === "metric" ? v * 2.20462 : v });
            }}
          />
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 10 }}>
          {profile.heightIn ? formatHeight(profile.heightIn, profile.measurementUnits) : "—"} ·{" "}
          {profile.age ? `${profile.age} yrs` : "—"} ·{" "}
          {profile.currentWeight ? formatWeight(profile.currentWeight, profile.measurementUnits) : "—"}
        </div>
      </Card>

      {/* Goal */}
      <Card padding={16}>
        <CardTitle>Goal</CardTitle>
        <div style={{ display: "grid", gap: 12 }}>
          <Select
            label="Primary goal"
            value={profile.primaryGoal}
            onChange={(e) => saveProfile({ primaryGoal: e.target.value as GoalType })}
            options={GOAL_OPTIONS}
          />
          <Field label="Pace">
            <SegmentedControl
              options={[
                { value: "slow", label: "Steady" },
                { value: "moderate", label: "Moderate" },
                { value: "aggressive", label: "Aggressive" },
              ]}
              value={profile.desiredPace}
              onChange={(v) => saveProfile({ desiredPace: v as DesiredPace })}
            />
          </Field>
          <Select
            label="Activity level"
            value={profile.activityLevel}
            onChange={(e) => saveProfile({ activityLevel: e.target.value as ActivityLevel })}
            options={[
              { value: "sedentary", label: "Sedentary" },
              { value: "light", label: "Light" },
              { value: "moderate", label: "Moderate" },
              { value: "active", label: "Active" },
              { value: "very_active", label: "Very active" },
            ]}
          />
          {data.targets && (
            <div style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
              Daily targets: <strong className="if-num">{data.targets.calories.toLocaleString()} kcal</strong> · {data.targets.protein}g protein ·{" "}
              {data.targets.carbs}g carbs · {data.targets.fat}g fat · {data.targets.waterOz}oz water
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Recalculated automatically when your stats or goal change.
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Coach style */}
      <Card padding={16}>
        <CardTitle>Coach style</CardTitle>
        <div style={{ display: "grid", gap: 8 }}>
          {(
            [
              ["encouraging", "Encouraging Coach", "Warm, patient, supportive."],
              ["balanced", "Balanced Coach", "Direct and practical. The default."],
              ["no_excuses", "No Excuses Coach", "Blunt, intense, data-driven. May hurt your feelings."],
            ] as const
          ).map(([value, label, desc]) => {
            const active = profile.coachStyle === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setCoach(value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  textAlign: "left",
                  padding: 14,
                  borderRadius: "var(--radius-md)",
                  border: `1.5px solid ${active ? (value === "no_excuses" ? "var(--danger-500)" : "var(--forest-500)") : "var(--border-subtle)"}`,
                  background: value === "no_excuses" ? "var(--ink-900)" : "var(--surface-card)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{desc}</div>
                </div>
                {active && <Pill color={value === "no_excuses" ? "var(--danger-500)" : "var(--forest-500)"}>Active</Pill>}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Health integrations */}
      <Card padding={16}>
        <CardTitle>Health integrations</CardTitle>
        <div style={{ display: "grid", gap: 6 }}>
          {INTEGRATIONS.map(({ provider, label, Icon }) => (
            <div key={provider} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: "1px solid var(--border-subtle)" }}>
              <Icon size={18} color="var(--text-muted)" />
              <span style={{ flex: 1, fontSize: 14.5 }}>{label}</span>
              <Pill color="var(--ink-400)">Coming soon</Pill>
            </div>
          ))}
        </div>
      </Card>

      {/* Account */}
      <Card padding={16}>
        <CardTitle>Account</CardTitle>
        <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 14 }}>
          {user?.email}
          {!supabaseMode && (
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>
              Local demo mode — data lives on this device. Connect Supabase in .env.local for cloud sync.
            </div>
          )}
        </div>
        <Button
          variant="outline"
          leadingIcon={<LogOut size={16} />}
          onClick={async () => {
            await signOut();
            router.replace("/");
          }}
        >
          Log out
        </Button>
      </Card>

      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
        InnerForm provides nutrition, habit, and wellness coaching. It is not medical advice and does not diagnose, treat, or
        prevent any disease. Consult a qualified healthcare professional before making major changes to your diet, exercise, or
        health routine, especially if you have a medical condition, eating disorder history, are pregnant, or are taking
        medication. AI coaching can make mistakes — review recommendations carefully and use your judgment.
      </p>

      {/* No Excuses confirmations */}
      <Modal open={confirmNE === 1} onClose={() => setConfirmNE(0)} title="Are you sure?">
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <ShieldAlert size={28} color="var(--danger-500)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>
              No Excuses Coach is direct, intense, and confrontational. It will challenge your excuses, call out inconsistent
              behavior, and tell you when your actions do not match your stated goals. It will not curse at you, insult you, shame
              your body, or recommend unsafe behavior. But it may hurt your feelings. Choose this mode only if you want hard
              accountability.
            </p>
          </div>
          <Button variant="danger" fullWidth onClick={() => setConfirmNE(2)}>
            I want the hard truth.
          </Button>
          <Button variant="outline" fullWidth onClick={() => setConfirmNE(0)}>
            Choose a gentler coach.
          </Button>
        </div>
      </Modal>
      <Modal open={confirmNE === 2} onClose={() => setConfirmNE(0)} title="Last check">
        <div style={{ display: "grid", gap: 16 }}>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>
            No Excuses Coach is not here to flatter you. It is here to help you follow through. You can change this setting
            anytime.
          </p>
          <Button
            variant="danger"
            fullWidth
            onClick={() => {
              saveProfile({ coachStyle: "no_excuses" });
              setConfirmNE(0);
            }}
          >
            Yes. Hold me accountable.
          </Button>
        </div>
      </Modal>
    </div>
  );
}
