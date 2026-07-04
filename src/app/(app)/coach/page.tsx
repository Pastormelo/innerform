"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Send, Sparkles, Trophy, X } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip, Pill } from "@/components/ui/Chip";
import { ProgressBar } from "@/components/ui/MacroBar";
import { NavHeader } from "@/components/ui/NavHeader";
import { useApp, uid } from "@/lib/store/AppStoreProvider";
import { buildCoachContext } from "@/lib/coach/context";
import { generateCoachReply, SUGGESTED_PROMPTS } from "@/lib/coach/engine";
import type { Challenge, CoachMessage, CoachReply } from "@/types";

const STYLE_NAMES = { encouraging: "Encouraging Coach", balanced: "Balanced Coach", no_excuses: "No Excuses Coach" };
const MODE_COLORS: Record<string, string> = {
  celebrate: "var(--gold-500)",
  encourage: "var(--forest-500)",
  nudge: "var(--warning-500)",
  challenge: "var(--danger-500)",
  reset: "var(--fiber-500)",
};

export default function CoachPage() {
  const { data, update, recentDays, weightTrend, awardBadge } = useApp();
  const profile = data.profile!;
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [pendingChallenge, setPendingChallenge] = useState<CoachReply["challenge"]>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chat = data.coachMessages.filter((m) => m.source === "chat");
  const activeChallenges = data.challenges.filter((c) => c.status === "active");
  const trend = useMemo(() => weightTrend(), [weightTrend]);

  // Seed an opening coach message once.
  useEffect(() => {
    if (chat.length === 0) {
      const ctx = buildCoachContext(data, recentDays(7), trend);
      if (!ctx) return;
      const reply = generateCoachReply(ctx);
      pushCoach(reply);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [data.coachMessages.length, thinking]);

  function pushCoach(reply: CoachReply) {
    const msg: CoachMessage = {
      id: uid(),
      userId: profile.authUserId,
      role: "coach",
      message: reply.message,
      coachStyle: profile.coachStyle,
      mode: reply.mode,
      source: "chat",
      suggestedAction: reply.suggestedAction,
      createdAt: new Date().toISOString(),
    };
    update((d) => ({ ...d, coachMessages: [...d.coachMessages, msg] }));
    if (reply.challenge) setPendingChallenge(reply.challenge);
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || thinking) return;
    setInput("");
    const userMsg: CoachMessage = {
      id: uid(),
      userId: profile.authUserId,
      role: "user",
      message: q,
      coachStyle: null,
      mode: null,
      source: "chat",
      suggestedAction: null,
      createdAt: new Date().toISOString(),
    };
    update((d) => ({ ...d, coachMessages: [...d.coachMessages, userMsg] }));
    setThinking(true);

    const ctx = buildCoachContext(data, recentDays(7), trend, q);
    let reply: CoachReply | null = null;
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(ctx),
      });
      if (res.ok) reply = (await res.json()).reply as CoachReply;
    } catch {
      /* offline — fall through to local engine */
    }
    if (!reply && ctx) reply = generateCoachReply(ctx);
    // Small delay so the reply feels considered, not canned.
    await new Promise((r) => setTimeout(r, 350));
    setThinking(false);
    if (reply) pushCoach(reply);
  }

  function acceptChallenge() {
    if (!pendingChallenge) return;
    const c: Challenge = {
      ...pendingChallenge,
      id: uid(),
      userId: profile.authUserId,
      currentValue: 0,
      status: "active",
    };
    update((d) => ({ ...d, challenges: [...d.challenges, c] }));
    setPendingChallenge(null);
  }

  function completeChallenge(c: Challenge) {
    update((d) => ({
      ...d,
      challenges: d.challenges.map((x) => (x.id === c.id ? { ...x, currentValue: x.targetValue, status: "completed" } : x)),
    }));
    awardBadge(c.rewardBadge, c.title.replace(" Challenge", ""), `Completed: ${c.description}`);
  }

  function skipChallenge(c: Challenge) {
    update((d) => ({ ...d, challenges: d.challenges.map((x) => (x.id === c.id ? { ...x, status: "skipped" } : x)) }));
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <NavHeader
        overline={STYLE_NAMES[profile.coachStyle]}
        title="Coach"
        right={
          <Pill color={profile.coachStyle === "no_excuses" ? "var(--danger-500)" : "var(--forest-500)"}>
            <Sparkles size={12} /> {profile.coachStyle.replace("_", " ")}
          </Pill>
        }
      />

      {/* Active challenges */}
      {activeChallenges.length > 0 && (
        <Card padding={16}>
          <CardTitle>Active challenges</CardTitle>
          <div style={{ display: "grid", gap: 14 }}>
            {activeChallenges.map((c) => (
              <div key={c.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <strong style={{ fontSize: 14.5 }}>{c.title}</strong>
                  <span className="if-num" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                    {c.currentValue}/{c.targetValue}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 8px" }}>{c.description}</p>
                <ProgressBar value={c.currentValue / Math.max(1, c.targetValue)} color="gold" height={6} />
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <Button size="sm" variant="secondary" leadingIcon={<Trophy size={13} />} onClick={() => completeChallenge(c)}>
                    Mark complete
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => skipChallenge(c)}>
                    Skip
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Chat */}
      <Card padding={0} style={{ display: "flex", flexDirection: "column", height: "56dvh", minHeight: 380 }}>
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {chat.map((m) => (
            <Bubble key={m.id} msg={m} />
          ))}
          {thinking && (
            <div style={{ alignSelf: "flex-start", padding: "10px 16px", borderRadius: "var(--radius-lg)", background: "var(--surface-card-2)", fontSize: 14, color: "var(--text-muted)" }}>
              Coach is thinking…
            </div>
          )}
          {pendingChallenge && (
            <div className="if-glass if-fade-up" style={{ padding: 16, border: "1px solid color-mix(in srgb, var(--gold-500) 40%, transparent)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div className="if-overline" style={{ color: "var(--gold-500)" }}>
                  Challenge offered
                </div>
                <button type="button" onClick={() => setPendingChallenge(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                  <X size={16} />
                </button>
              </div>
              <strong style={{ fontSize: 15 }}>{pendingChallenge.title}</strong>
              <p style={{ fontSize: 13.5, color: "var(--text-secondary)", margin: "4px 0 12px" }}>{pendingChallenge.description}</p>
              <Button size="sm" variant="gold" onClick={acceptChallenge} leadingIcon={<Trophy size={14} />}>
                Accept challenge
              </Button>
            </div>
          )}
        </div>

        {/* Suggested prompts */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "0 16px 10px" }}>
          {SUGGESTED_PROMPTS.map((p) => (
            <div key={p} style={{ flexShrink: 0 }}>
              <Chip label={p} size="sm" onClick={() => send(p)} />
            </div>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          style={{ display: "flex", gap: 8, padding: "0 16px 16px" }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your coach…"
            style={{
              flex: 1,
              height: 46,
              padding: "0 16px",
              borderRadius: "var(--radius-pill)",
              background: "var(--surface-inset)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              fontSize: 15,
            }}
          />
          <Button aria-label="Send" disabled={!input.trim() || thinking} {...{ type: "submit" }} style={{ width: 46, padding: 0 }}>
            <Send size={17} />
          </Button>
        </form>
      </Card>

      <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", margin: 0 }}>
        AI coaching can make mistakes. Review recommendations carefully and use your judgment.
      </p>
    </div>
  );
}

function Bubble({ msg }: { msg: CoachMessage }) {
  const isCoach = msg.role === "coach";
  return (
    <div style={{ alignSelf: isCoach ? "flex-start" : "flex-end", maxWidth: "85%" }}>
      <div
        style={{
          padding: "12px 16px",
          borderRadius: "var(--radius-lg)",
          borderBottomLeftRadius: isCoach ? 6 : undefined,
          borderBottomRightRadius: isCoach ? undefined : 6,
          background: isCoach ? "var(--surface-card-2)" : "var(--forest-600)",
          color: "var(--text-primary)",
          fontSize: 14.5,
          whiteSpace: "pre-line",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {msg.message}
      </div>
      {isCoach && msg.mode && (
        <div style={{ display: "flex", gap: 6, marginTop: 5, alignItems: "center" }}>
          <Pill color={MODE_COLORS[msg.mode]}>{msg.mode}</Pill>
          {msg.suggestedAction && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>→ {msg.suggestedAction}</span>}
        </div>
      )}
    </div>
  );
}
