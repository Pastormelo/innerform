"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Heart, LogOut, ShieldAlert, Smartphone, Watch, Scale as ScaleIcon } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Chip";
import { Input, Select, Field } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { NavHeader } from "@/components/ui/NavHeader";
import { useApp } from "@/lib/store/AppStoreProvider";
import { formatHeight, formatWeight } from "@/lib/nutrition/calculations";
import type { ActivityLevel, CoachStyle, DesiredPace, GoalType, HealthProvider } from "@/types";

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
  const { data, saveProfile, signOut, user, supabaseMode } = useApp();
  const router = useRouter();
  const profile = data.profile!;
  const [confirmNE, setConfirmNE] = useState<0 | 1 | 2>(0);

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
