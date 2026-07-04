import type { CoachContext, DayStats, WeightTrend } from "@/types";
import type { AppData } from "@/lib/store/AppStoreProvider";

/** Assemble the CoachContext the engine/prompt layers expect from store data. */
export function buildCoachContext(
  data: AppData,
  recentDays: DayStats[],
  weightTrend: WeightTrend,
  userQuestion?: string,
): CoachContext | null {
  if (!data.profile) return null;
  return {
    profile: data.profile,
    motivation: data.motivation,
    hardGainer: data.hardGainer,
    recentDays,
    weightTrend,
    streaks: data.streaks,
    activeChallenges: data.challenges.filter((c) => c.status === "active"),
    userQuestion,
  };
}
