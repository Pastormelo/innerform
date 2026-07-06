"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Droplet, Flame, Heart, Send, TrendingDown, TrendingUp, UtensilsCrossed } from "lucide-react";
import { Wordmark, LogoMark } from "@/components/brand/Logo";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSharedBySlug, sendEncouragement, type SharedProgressRow } from "@/lib/supabase/social";
import { formatWeight } from "@/lib/nutrition/calculations";

const GOAL_LABELS: Record<string, string> = {
  lose_weight: "Losing weight",
  gain_weight: "Gaining weight",
  maintain_weight: "Maintaining weight",
  body_recomposition: "Body recomposition",
  build_muscle: "Building muscle",
};

export default function SharedProgressPage() {
  const params = useParams();
  const slug = String(params.slug ?? "");
  const [state, setState] = useState<"loading" | "ready" | "notfound" | "unconfigured">("loading");
  const [row, setRow] = useState<SharedProgressRow | null>(null);
  const [fromName, setFromName] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    (async () => {
      if (!client) {
        setState("unconfigured");
        return;
      }
      const r = await getSharedBySlug(client, slug);
      if (r) {
        setRow(r);
        setState("ready");
      } else {
        setState("notfound");
      }
    })();
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!row || !body.trim()) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    setSending(true);
    const ok = await sendEncouragement(client, row.user_id, fromName.trim(), body.trim());
    setSending(false);
    if (ok) {
      setSent(true);
      setBody("");
    }
  }

  return (
    <main style={{ minHeight: "100dvh", background: "var(--grad-hero)" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 20px 64px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <Wordmark size={18} />
        </div>

        {state === "loading" && (
          <div style={{ textAlign: "center", color: "var(--text-muted)", paddingTop: 60 }}>
            <LogoMark size={44} />
            <p style={{ marginTop: 12 }}>Loading…</p>
          </div>
        )}

        {state === "unconfigured" && (
          <Card style={{ textAlign: "center", padding: 32 }}>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>Sharing isn&apos;t available on this instance.</p>
          </Card>
        )}

        {state === "notfound" && (
          <Card style={{ textAlign: "center", padding: 32 }}>
            <h1 className="if-display" style={{ fontSize: 26, margin: "0 0 8px" }}>Link not found</h1>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>
              This progress link is invalid or sharing has been turned off.
            </p>
          </Card>
        )}

        {state === "ready" && row && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div className="if-overline" style={{ color: "var(--forest-500)", marginBottom: 6 }}>Accountability</div>
              <h1 className="if-display" style={{ fontSize: 34, margin: 0 }}>
                {row.display_name || "A friend"}&apos;s progress
              </h1>
              <p style={{ color: "var(--text-secondary)", marginTop: 6 }}>
                {GOAL_LABELS[row.stats.goal] ?? "Working on their health"}
              </p>
            </div>

            {/* Streaks */}
            <Card>
              <CardTitle>Streaks</CardTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, textAlign: "center" }}>
                {[
                  { label: "Logging", v: row.stats.loggingStreak, Icon: UtensilsCrossed },
                  { label: "Protein", v: row.stats.proteinStreak, Icon: Flame },
                  { label: "Water", v: row.stats.waterStreak, Icon: Droplet },
                ].map(({ label, v, Icon }) => (
                  <div key={label}>
                    <Icon size={18} color={v > 0 ? "var(--gold-500)" : "var(--text-muted)"} />
                    <div className="if-num" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, marginTop: 4 }}>{v}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Consistency + weight */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Card padding={16}>
                <CardTitle>This week</CardTitle>
                <div className="if-num" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30 }}>{row.stats.daysLoggedLast7}/7</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>days logged</div>
              </Card>
              <Card padding={16}>
                <CardTitle>Weight trend</CardTitle>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {row.stats.weightTrendDir === "down" ? (
                    <TrendingDown size={22} color="var(--forest-500)" />
                  ) : row.stats.weightTrendDir === "up" ? (
                    <TrendingUp size={22} color="var(--protein-500)" />
                  ) : (
                    <span style={{ fontSize: 20 }}>→</span>
                  )}
                  <span className="if-num" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22 }}>
                    {row.stats.weeklyRateLbs != null ? `${row.stats.weeklyRateLbs > 0 ? "+" : ""}${row.stats.weeklyRateLbs.toFixed(1)}` : "—"}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {row.stats.weeklyRateLbs != null ? "lb/week" : "not enough data"}
                  {row.stats.currentWeight != null && ` · now ${formatWeight(row.stats.currentWeight, row.stats.units)}`}
                </div>
              </Card>
            </div>

            {/* Encouragement */}
            <Card>
              <CardTitle>Send an encouragement</CardTitle>
              {sent ? (
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <Heart size={26} color="var(--gold-500)" />
                  <p style={{ margin: "8px 0 0", color: "var(--text-secondary)" }}>Sent. It&apos;ll show up in their app — thank you.</p>
                  <button type="button" onClick={() => setSent(false)} style={{ background: "none", border: "none", color: "var(--forest-400)", fontWeight: 600, cursor: "pointer", marginTop: 6 }}>
                    Send another
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
                  <Input placeholder="Your name" value={fromName} onChange={(e) => setFromName(e.target.value)} />
                  <Textarea placeholder="Keep going — I'm proud of you…" value={body} onChange={(e) => setBody(e.target.value)} style={{ minHeight: 80 }} />
                  <Button {...{ type: "submit" }} disabled={!body.trim()} loading={sending} leadingIcon={<Send size={16} />}>
                    Send encouragement
                  </Button>
                </form>
              )}
            </Card>

            <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
              Powered by InnerForm · Built from the inside out.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
