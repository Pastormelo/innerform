"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useApp } from "@/lib/store/AppStoreProvider";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { user, loading, signIn, signUp, supabaseMode, data } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(data.profile?.onboardingCompleted ? "/dashboard" : "/onboarding");
    }
  }, [loading, user, data.profile?.onboardingCompleted, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const err = mode === "signup" ? await signUp(email.trim(), password) : await signIn(email.trim(), password);
    setBusy(false);
    if (err) setError(err);
    // Redirect handled by the effect once user state lands.
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--grad-hero)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Link href="/" style={{ textDecoration: "none", marginBottom: 36 }}>
        <Wordmark size={22} />
      </Link>

      <div className="if-glass if-fade-up" style={{ width: "100%", maxWidth: 400, padding: 28 }}>
        <h1 className="if-display" style={{ fontSize: 30, margin: "0 0 6px" }}>
          {mode === "signup" ? "Start building" : "Welcome back"}
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 22px" }}>
          {mode === "signup"
            ? "Create your account. The intake takes five minutes and it's where the real coaching starts."
            : "Log in to pick up where you left off."}
        </p>

        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                background: "color-mix(in srgb, var(--danger-500) 14%, transparent)",
                border: "1px solid color-mix(in srgb, var(--danger-500) 35%, transparent)",
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}
          <Button size="lg" fullWidth loading={busy} onClick={undefined} {...{ type: "submit" }}>
            {mode === "signup" ? "Create account" : "Log in"}
          </Button>
        </form>

        <p style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center", marginTop: 18, marginBottom: 0 }}>
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--forest-400)", fontWeight: 600 }}>
                Log in
              </Link>
            </>
          ) : (
            <>
              New to InnerForm?{" "}
              <Link href="/signup" style={{ color: "var(--forest-400)", fontWeight: 600 }}>
                Start building
              </Link>
            </>
          )}
        </p>
      </div>

      {!supabaseMode && (
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 18, maxWidth: 400, textAlign: "center" }}>
          Running in local demo mode — accounts and data are stored on this device. Add Supabase keys to .env.local for
          real authentication.
        </p>
      )}
    </main>
  );
}
