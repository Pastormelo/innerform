"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Award, Camera, Droplet, Flame, ImageIcon, Scale, Snowflake, Trophy, Trash2, UtensilsCrossed } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatTile } from "@/components/ui/StatTile";
import { Pill } from "@/components/ui/Chip";
import { NavHeader } from "@/components/ui/NavHeader";
import { useApp } from "@/lib/store/AppStoreProvider";
import { fileToResizedDataUrl } from "@/lib/image";
import { daysAgo, formatShort, todayStr } from "@/lib/dates";
import { formatWeight } from "@/lib/nutrition/calculations";
import type { StreakType } from "@/types";

const Charts = dynamic(() => import("@/components/progress/Charts"), {
  ssr: false,
  loading: () => <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 14 }}>Loading charts…</div>,
});

const STREAK_META: { type: StreakType; label: string; Icon: React.ElementType }[] = [
  { type: "logging", label: "Logging", Icon: UtensilsCrossed },
  { type: "protein", label: "Protein", Icon: Flame },
  { type: "water", label: "Water", Icon: Droplet },
  { type: "weigh_in", label: "Weigh-in", Icon: Scale },
];

export default function ProgressPage() {
  const { data, recentDays, weightTrend, addWeighIn, streakFor, applyStreakFreeze, addProgressPhoto, removeProgressPhoto } = useApp();
  const profile = data.profile!;
  const trend = weightTrend();
  const [weighOpen, setWeighOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");

  // Streaks at risk: active (>1) but not updated since the day before yesterday.
  const atRisk = data.streaks.filter((s) => s.currentCount > 1 && s.lastUpdatedDate != null && s.lastUpdatedDate <= daysAgo(2));

  async function onProgressPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await fileToResizedDataUrl(file, 640, 0.75);
    addProgressPhoto(url, trend.latestWeight, null);
  }

  const mealPhotos = data.foodLogs.filter((l) => l.imageUrl).slice(-24).reverse();

  const days = useMemo(() => recentDays(14).reverse(), [recentDays]);
  const weighData = useMemo(
    () =>
      [...data.weighIns]
        .sort((a, b) => a.logDate.localeCompare(b.logDate))
        .map((w) => ({ date: formatShort(w.logDate), weight: w.weight })),
    [data.weighIns],
  );

  const completedChallenges = data.challenges.filter((c) => c.status === "completed").length;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <NavHeader
        overline="Progress"
        title="The trend"
        right={
          <Button size="sm" onClick={() => setWeighOpen(true)} leadingIcon={<Scale size={15} />}>
            Weigh in
          </Button>
        }
      />

      {/* Weight summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <StatTile
          label="Current"
          value={trend.latestWeight ? formatWeight(trend.latestWeight, profile.measurementUnits) : "—"}
          sub={trend.weeklyRateLbs != null && trend.entries >= 3 ? `${trend.weeklyRateLbs > 0 ? "+" : ""}${trend.weeklyRateLbs.toFixed(1)} lb/week` : "log 3+ weigh-ins for a trend"}
        />
        <StatTile
          label="Goal"
          value={profile.goalWeight ? formatWeight(profile.goalWeight, profile.measurementUnits) : "—"}
          sub={
            trend.latestWeight && profile.goalWeight
              ? `${Math.abs(trend.latestWeight - profile.goalWeight).toFixed(1)} lb to go`
              : undefined
          }
          accent="var(--forest-400)"
        />
      </div>

      <Charts weighData={weighData} days={days} targets={data.targets} stepsGoal={profile.stepsGoal} />

      {/* Streaks */}
      <Card padding={16}>
        <CardTitle>Streaks</CardTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, textAlign: "center" }}>
          {STREAK_META.map(({ type, label, Icon }) => {
            const s = streakFor(type);
            return (
              <div key={type}>
                <Icon size={18} color={s?.currentCount ? "var(--gold-500)" : "var(--text-muted)"} />
                <div className="if-num" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, marginTop: 4 }}>
                  {s?.currentCount ?? 0}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</div>
                {s && s.bestCount > 1 && <div style={{ fontSize: 10, color: "var(--text-muted)" }}>best {s.bestCount}</div>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Streak freezes */}
      <Card padding={16}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Snowflake size={16} color="var(--fiber-500)" />
            <CardTitle style={{ marginBottom: 0 }}>Streak freezes</CardTitle>
          </div>
          <Pill color="var(--fiber-500)">{data.streakFreezes} available</Pill>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "8px 0 0" }}>
          A freeze protects a streak through one missed day, so a single off-day doesn&apos;t erase weeks of momentum.
        </p>
        {atRisk.length > 0 && data.streakFreezes > 0 && (
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {atRisk.map((s) => (
              <div key={s.id} className="if-glass" style={{ padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, fontSize: 13.5 }}>
                  Your <strong>{s.currentCount}-day {s.streakType.replace(/_/g, " ")}</strong> streak is at risk.
                </div>
                <Button size="sm" variant="secondary" leadingIcon={<Snowflake size={13} />} onClick={() => applyStreakFreeze(s.streakType)}>
                  Freeze it
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Progress photos */}
      <Card padding={16}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ImageIcon size={16} color="var(--text-secondary)" />
            <CardTitle style={{ marginBottom: 0 }}>Progress photos</CardTitle>
          </div>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--border-strong)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              color: "var(--text-secondary)",
            }}
          >
            <Camera size={14} /> Add photo
            <input type="file" accept="image/*" onChange={onProgressPhoto} style={{ display: "none" }} />
          </label>
        </div>
        {data.progressPhotos.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>
            No photos yet. Progress you can see beats a number on the scale on the weeks the scale lies.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {data.progressPhotos.map((p) => (
              <div key={p.id} style={{ position: "relative", aspectRatio: "3/4", borderRadius: "var(--radius-md)", overflow: "hidden", background: "var(--surface-inset)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "4px 6px", background: "linear-gradient(transparent, rgba(0,0,0,0.7))", fontSize: 10.5, color: "#fff" }}>
                  {formatShort(p.logDate)}
                  {p.weight != null && ` · ${Math.round(p.weight)}`}
                </div>
                <button
                  type="button"
                  onClick={() => removeProgressPhoto(p.id)}
                  aria-label="Delete photo"
                  style={{ position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.5)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Meal photo journal */}
      {mealPhotos.length > 0 && (
        <Card padding={16}>
          <CardTitle>Meal journal</CardTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {mealPhotos.map((l) => (
              <div key={l.id} style={{ position: "relative", aspectRatio: "1", borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--surface-inset)" }} title={`${l.customName ?? "meal"} · ${formatShort(l.logDate)}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.imageUrl!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Challenges + badges */}
      <Card padding={16}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <CardTitle style={{ marginBottom: 0 }}>Badges</CardTitle>
          <Pill color="var(--gold-500)">
            <Trophy size={12} /> {completedChallenges} challenge{completedChallenges === 1 ? "" : "s"} completed
          </Pill>
        </div>
        {data.badges.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>
            No badges yet. They&apos;re earned, not given — log a full day to start.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {data.badges.map((b) => (
              <div key={b.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "var(--radius-md)",
                    background: "var(--grad-gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Award size={21} color="var(--ink-950)" />
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>{b.title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{b.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Weigh-in modal */}
      <Modal open={weighOpen} onClose={() => setWeighOpen(false)} title="Weigh in">
        <div style={{ display: "grid", gap: 14 }}>
          <Input
            label={`Weight (${profile.measurementUnits === "imperial" ? "lb" : "kg"})`}
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={trend.latestWeight ? String(trend.latestWeight) : "170"}
          />
          <Input label="Note" optional value={note} onChange={(e) => setNote(e.target.value)} placeholder="Morning, after travel…" />
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-muted)" }}>
            One day is not a trend. Weigh consistently — same time, same conditions — and judge the weekly average.
          </p>
          <Button
            fullWidth
            disabled={!Number(weight)}
            onClick={() => {
              const lbs = profile.measurementUnits === "metric" ? Number(weight) * 2.20462 : Number(weight);
              addWeighIn(Math.round(lbs * 10) / 10, note || undefined, todayStr());
              setWeighOpen(false);
              setWeight("");
              setNote("");
            }}
          >
            Save weigh-in
          </Button>
        </div>
      </Modal>
    </div>
  );
}
