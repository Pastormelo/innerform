import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppData } from "@/lib/store/AppStoreProvider";

/* ============================================================
   Cloud document sync. Persists the per-user AppData document as
   a single JSONB row in `app_state`, giving cross-device sync
   without a per-table rewrite. All calls are defensive: if the
   table is missing or the network fails, callers fall back to
   the localStorage cache and the app keeps working offline.
   ============================================================ */

export async function loadCloudState(client: SupabaseClient, userId: string): Promise<AppData | null> {
  try {
    const { data, error } = await client.from("app_state").select("data").eq("user_id", userId).maybeSingle();
    if (error) {
      console.warn("Cloud load failed (using local cache):", error.message);
      return null;
    }
    return (data?.data as AppData) ?? null;
  } catch (err) {
    console.warn("Cloud load threw (using local cache):", err);
    return null;
  }
}

export async function saveCloudState(client: SupabaseClient, userId: string, data: AppData): Promise<boolean> {
  try {
    const { error } = await client
      .from("app_state")
      .upsert({ user_id: userId, data, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) {
      console.warn("Cloud save failed (kept local):", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Cloud save threw (kept local):", err);
    return false;
  }
}

/** True if the document holds anything worth pushing (avoids clobbering cloud with an empty doc). */
export function hasMeaningfulData(d: AppData): boolean {
  return Boolean(d.profile || d.foodLogs.length || d.weighIns.length || d.coachMessages.length);
}
