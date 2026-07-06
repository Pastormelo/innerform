"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Check, Copy, Heart, Users } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Pill } from "@/components/ui/Chip";
import { useApp } from "@/lib/store/AppStoreProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { loadMyNotes, loadMyShare, markNoteRead, setShareEnabled, upsertShare, type PartnerNote, type SharedProgressRow, type SharedStats } from "@/lib/supabase/social";
import { goalDirection } from "@/lib/nutrition/calculations";

/** Accountability sharing (social v1). Only meaningful with cloud sync on. */
export function AccountabilityCard() {
  const { data, user, supabaseMode, weightTrend, recentDays, streakFor } = useApp();
  const profile = data.profile!;
  const [share, setShare] = useState<SharedProgressRow | null>(null);
  const [notes, setNotes] = useState<PartnerNote[]>([]);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const buildStats = useCallback((): SharedStats => {
    const t = weightTrend();
    return {
      goal: profile.primaryGoal,
      currentWeight: profile.currentWeight,
      goalWeight: profile.goalWeight,
      weightTrendDir: t.direction,
      weeklyRateLbs: t.weeklyRateLbs,
      loggingStreak: streakFor("logging")?.currentCount ?? 0,
      proteinStreak: streakFor("protein")?.currentCount ?? 0,
      waterStreak: streakFor("water")?.currentCount ?? 0,
      daysLoggedLast7: recentDays(7).filter((d) => d.mealsLogged > 0).length,
      units: profile.measurementUnits,
    };
  }, [profile, weightTrend, streakFor, recentDays]);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    (async () => {
      if (!client || !user) {
        setLoaded(true);
        return;
      }
      setShare(await loadMyShare(client, user.id));
      setNotes(await loadMyNotes(client, user.id));
      setLoaded(true);
    })();
  }, [user]);

  if (!supabaseMode) {
    return (
      <Card padding={16}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Users size={16} color="var(--text-secondary)" />
          <CardTitle style={{ marginBottom: 0 }}>Accountability</CardTitle>
        </div>
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)" }}>
          Sharing your progress with a coach or partner needs cloud sync. Add your Supabase keys to enable it.
        </p>
      </Card>
    );
  }

  const client = getSupabaseBrowserClient()!;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = share ? `${origin}/shared/${share.slug}` : "";
  const unread = notes.filter((n) => !n.read);

  async function enable() {
    if (!user) return;
    setBusy(true);
    const row = await upsertShare(client, user.id, profile.name || "Someone", buildStats(), { enabled: true });
    setShare(row);
    setBusy(false);
  }

  async function toggle(on: boolean) {
    if (!user || !share) {
      if (on) await enable();
      return;
    }
    await setShareEnabled(client, user.id, on);
    setShare({ ...share, enabled: on });
  }

  async function refreshSnapshot() {
    if (!user) return;
    setBusy(true);
    const row = await upsertShare(client, user.id, profile.name || "Someone", buildStats());
    setShare(row);
    setBusy(false);
  }

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function dismissNote(id: string) {
    await markNoteRead(client, id);
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  const dir = goalDirection(profile.primaryGoal);

  return (
    <Card padding={16}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={16} color="var(--text-secondary)" />
          <CardTitle style={{ marginBottom: 0 }}>Accountability</CardTitle>
        </div>
        {unread.length > 0 && <Pill color="var(--gold-500)">{unread.length} new</Pill>}
      </div>

      <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "var(--text-secondary)" }}>
        Share a private, read-only view of your progress — streaks, weight trend, and consistency — with a coach, spouse, or
        friend. They can send you encouragement without seeing your full diary.
      </p>

      {loaded && (
        <Switch label="Share my progress" checked={Boolean(share?.enabled)} onChange={toggle} />
      )}

      {share?.enabled && (
        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              style={{ flex: 1, height: 44, padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--surface-inset)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", fontSize: 13 }}
            />
            <Button variant="secondary" onClick={copy} leadingIcon={copied ? <Check size={15} /> : <Copy size={15} />}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={refreshSnapshot} loading={busy}>
            Update the shared snapshot
          </Button>
          <p style={{ margin: 0, fontSize: 11.5, color: "var(--text-muted)" }}>
            Snapshot reflects your {dir === "gain" ? "gain" : dir === "loss" ? "loss" : "maintenance"} goal as of the last update. Refresh it whenever you want partners to see current numbers.
          </p>
        </div>
      )}

      {notes.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="if-overline" style={{ color: "var(--gold-500)", marginBottom: 8 }}>Encouragements</div>
          <div style={{ display: "grid", gap: 8 }}>
            {notes.slice(0, 8).map((n) => (
              <div key={n.id} className="if-glass" style={{ padding: 12, opacity: n.read ? 0.6 : 1, border: n.read ? undefined : "1px solid color-mix(in srgb, var(--gold-500) 30%, transparent)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <Heart size={15} color="var(--gold-500)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14 }}>{n.body}</p>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                      — {n.from_name ?? "A friend"} · {new Date(n.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {!n.read && (
                    <button type="button" onClick={() => dismissNote(n.id)} style={{ background: "none", border: "none", color: "var(--forest-400)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
