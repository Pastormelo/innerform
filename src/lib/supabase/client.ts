"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/* ============================================================
   Supabase browser client. Returns null when env vars are not
   configured — the app then runs in local demo mode (data in
   localStorage, demo auth). Add NEXT_PUBLIC_SUPABASE_URL and
   NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to go live.
   ============================================================ */

let cached: SupabaseClient | null | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  if (!isSupabaseConfigured()) {
    cached = null;
    return cached;
  }
  cached = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return cached;
}
