import type { SupabaseClient } from "@supabase/supabase-js";

/* ============================================================
   Accountability sharing (social v1). A user publishes a small
   read-only progress snapshot under a private slug; viewers open
   /shared/<slug> and can send encouragements back. All reads of
   enabled shares and note inserts are allowed to anon by RLS.
   ============================================================ */

export interface SharedStats {
  goal: string;
  currentWeight: number | null;
  goalWeight: number | null;
  weightTrendDir: "up" | "down" | "flat" | "unknown";
  weeklyRateLbs: number | null;
  loggingStreak: number;
  proteinStreak: number;
  waterStreak: number;
  daysLoggedLast7: number;
  units: "imperial" | "metric";
}

export interface SharedProgressRow {
  user_id: string;
  slug: string;
  display_name: string | null;
  enabled: boolean;
  stats: SharedStats;
  updated_at: string;
}

export interface PartnerNote {
  id: string;
  owner_id: string;
  from_name: string | null;
  body: string;
  read: boolean;
  created_at: string;
}

export function makeSlug(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

/** Create or update the user's shared snapshot. Preserves an existing slug. */
export async function upsertShare(
  client: SupabaseClient,
  userId: string,
  displayName: string,
  stats: SharedStats,
  opts?: { enabled?: boolean },
): Promise<SharedProgressRow | null> {
  try {
    const existing = await loadMyShare(client, userId);
    const slug = existing?.slug ?? makeSlug();
    const row = {
      user_id: userId,
      slug,
      display_name: displayName,
      enabled: opts?.enabled ?? existing?.enabled ?? true,
      stats,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await client.from("shared_progress").upsert(row, { onConflict: "user_id" }).select().maybeSingle();
    if (error) {
      console.warn("Share upsert failed:", error.message);
      return null;
    }
    return data as SharedProgressRow;
  } catch (err) {
    console.warn("Share upsert threw:", err);
    return null;
  }
}

export async function loadMyShare(client: SupabaseClient, userId: string): Promise<SharedProgressRow | null> {
  const { data } = await client.from("shared_progress").select("*").eq("user_id", userId).maybeSingle();
  return (data as SharedProgressRow) ?? null;
}

export async function setShareEnabled(client: SupabaseClient, userId: string, enabled: boolean): Promise<void> {
  await client.from("shared_progress").update({ enabled, updated_at: new Date().toISOString() }).eq("user_id", userId);
}

/** Public read by slug (works for logged-out viewers via RLS). */
export async function getSharedBySlug(client: SupabaseClient, slug: string): Promise<SharedProgressRow | null> {
  const { data, error } = await client.from("shared_progress").select("*").eq("slug", slug).eq("enabled", true).maybeSingle();
  if (error) {
    console.warn("Shared load failed:", error.message);
    return null;
  }
  return (data as SharedProgressRow) ?? null;
}

export async function sendEncouragement(client: SupabaseClient, ownerId: string, fromName: string, body: string): Promise<boolean> {
  const { error } = await client.from("partner_notes").insert({ owner_id: ownerId, from_name: fromName || "A friend", body });
  if (error) {
    console.warn("Encouragement send failed:", error.message);
    return false;
  }
  return true;
}

export async function loadMyNotes(client: SupabaseClient, userId: string): Promise<PartnerNote[]> {
  const { data } = await client.from("partner_notes").select("*").eq("owner_id", userId).order("created_at", { ascending: false }).limit(50);
  return (data as PartnerNote[]) ?? [];
}

export async function markNoteRead(client: SupabaseClient, id: string): Promise<void> {
  await client.from("partner_notes").update({ read: true }).eq("id", id);
}
