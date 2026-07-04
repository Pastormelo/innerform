import type { BodyLearningInsight, CoachContext, DayStats, MealType } from "@/types";
import { goalDirection } from "@/lib/nutrition/calculations";

/* ============================================================
   Body Learning Engine v1. Reads the last ~14 days of logs +
   weigh-ins and produces one insight: adjust the target, fix
   execution, or hold steady. Trend-first — never reacts to a
   single weigh-in.
   ============================================================ */

const MIN_DAYS_FOR_TARGET_CHANGE = 10;

interface WindowStats {
  logged: DayStats[];
  avgCalories: number;
  avgGap: number;
  proteinConsistency: number; // 0–1
  waterConsistency: number;
  loggingConsistency: number;
  missedMealCounts: Partial<Record<MealType, number>>;
  mostMissedMeal: MealType | null;
}

function windowStats(days: DayStats[]): WindowStats {
  const window = days.slice(0, 14);
  const logged = window.filter((d) => d.mealsLogged > 0);
  const n = Math.max(logged.length, 1);
  const avgCalories = Math.round(logged.reduce((s, d) => s + d.calories, 0) / n);
  const avgGap = Math.round(logged.reduce((s, d) => s + (d.calories - d.targetCalories), 0) / n);
  const proteinConsistency = logged.filter((d) => d.protein >= d.targetProtein * 0.9).length / n;
  const waterConsistency = logged.filter((d) => d.waterOz >= d.targetWaterOz * 0.9).length / n;
  const loggingConsistency = window.length ? logged.length / window.length : 0;

  const core: MealType[] = ["breakfast", "lunch", "dinner"];
  const missedMealCounts: Partial<Record<MealType, number>> = {};
  for (const meal of core) {
    missedMealCounts[meal] = logged.filter((d) => !d.loggedMealTypes.includes(meal)).length;
  }
  const mostMissedMeal =
    logged.length >= 4
      ? (core.sort((x, y) => (missedMealCounts[y] ?? 0) - (missedMealCounts[x] ?? 0))[0] ?? null)
      : null;

  return { logged, avgCalories, avgGap, proteinConsistency, waterConsistency, loggingConsistency, missedMealCounts, mostMissedMeal };
}

export function runBodyLearning(ctx: CoachContext): BodyLearningInsight {
  const dir = goalDirection(ctx.profile.primaryGoal);
  const w = windowStats(ctx.recentDays);
  const trend = ctx.weightTrend;
  const enoughData = w.logged.length >= MIN_DAYS_FOR_TARGET_CHANGE && trend.entries >= 4;

  // Not enough data → build the habit first.
  if (w.logged.length < 4) {
    return {
      headline: "Still learning your body",
      detail: `I have ${w.logged.length} logged day${w.logged.length === 1 ? "" : "s"} to work with. Log consistently for a week and weigh in 3–4 times, and I'll start tuning your targets to how your body actually responds — not a formula's guess.`,
      suggestedCalorieDelta: null,
      suggestedProteinDelta: null,
      mealTimingSuggestion: null,
      suggestedChallengeType: "logging",
      confidence: "low",
    };
  }

  if (dir === "gain") {
    // Under target → execution problem, never lower the goal.
    if (w.avgGap < -400) {
      const missed = w.mostMissedMeal && (w.missedMealCounts[w.mostMissedMeal] ?? 0) >= w.logged.length * 0.4 ? w.mostMissedMeal : null;
      return {
        headline: "The target isn't the problem. The gap is.",
        detail: `You're averaging ${Math.abs(w.avgGap)} calories under target. Don't change the goal yet — fix execution with one repeatable 400–700 calorie addition${missed ? `, and shore up ${missed} — you miss it ${w.missedMealCounts[missed]} days out of ${w.logged.length}` : ""}. ${ctx.hardGainer?.prefersLiquidCalories ? "A smoothie is your easiest 500." : "Olive oil, whole milk, peanut butter, granola — same meals, more fuel."}`,
        suggestedCalorieDelta: null,
        suggestedProteinDelta: null,
        mealTimingSuggestion: missed === "breakfast" ? "Add a quick high-calorie breakfast or shake — you're starting the day 500 behind." : missed === "lunch" ? "Pack a portable lunch + snack; your schedule is eating your calories." : "Move calories earlier in the day instead of betting on a big dinner.",
        suggestedChallengeType: "hard_gainer",
        confidence: "medium",
      };
    }
    // Hitting target but flat → raise it.
    if (enoughData && Math.abs(w.avgGap) <= 200 && (trend.direction === "flat" || trend.direction === "down")) {
      return {
        headline: "You're hitting the target. The target is too low.",
        detail: `${w.logged.length} days near target and the trend is ${trend.direction}. That's enough data: your body needs more. Raise the daily target by 150–250 calories and hold for two weeks.`,
        suggestedCalorieDelta: 200,
        suggestedProteinDelta: null,
        mealTimingSuggestion: null,
        suggestedChallengeType: null,
        confidence: "high",
      };
    }
    return {
      headline: trend.direction === "up" ? "The surplus is working" : "Holding course",
      detail:
        trend.direction === "up"
          ? `Weight is trending up${trend.weeklyRateLbs ? ` about ${Math.abs(trend.weeklyRateLbs).toFixed(1)} lb/week` : ""} and you're near target. Keep the same meals — repeatability is your advantage.`
          : `Execution is close but the trend needs more time. One day is not a trend; give it ${MIN_DAYS_FOR_TARGET_CHANGE - Math.min(w.logged.length, MIN_DAYS_FOR_TARGET_CHANGE)} more consistent days before we adjust anything.`,
      suggestedCalorieDelta: null,
      suggestedProteinDelta: w.proteinConsistency < 0.6 ? 0 : null,
      mealTimingSuggestion: null,
      suggestedChallengeType: w.proteinConsistency < 0.6 ? "protein" : null,
      confidence: "medium",
    };
  }

  if (dir === "loss") {
    // Over target → adherence before plan changes.
    if (w.avgGap > 300) {
      return {
        headline: "Adherence first, then adjustments",
        detail: `You're averaging ${w.avgGap} calories over target. Before changing any numbers, close the gap you already know about: ${w.proteinConsistency < 0.6 ? "protein is landing under target, which drives snacking — anchor meal one with 35g. " : ""}The plan works when it's executed.`,
        suggestedCalorieDelta: null,
        suggestedProteinDelta: null,
        mealTimingSuggestion: null,
        suggestedChallengeType: "logging",
        confidence: "medium",
      };
    }
    // At target but not losing → small adjustment.
    if (enoughData && Math.abs(w.avgGap) <= 200 && (trend.direction === "flat" || trend.direction === "up")) {
      return {
        headline: "Time for a small adjustment",
        detail: `You've been at target for ${w.logged.length} days and the trend is ${trend.direction}. Your body has adapted or maintenance was estimated high. Drop the target 100–150 calories — small moves, no crash cuts.`,
        suggestedCalorieDelta: -125,
        suggestedProteinDelta: null,
        mealTimingSuggestion: null,
        suggestedChallengeType: null,
        confidence: "high",
      };
    }
    return {
      headline: trend.direction === "down" ? "The deficit is doing its job" : "Stay the course",
      detail:
        trend.direction === "down"
          ? `Trending down${trend.weeklyRateLbs ? ` about ${Math.abs(trend.weeklyRateLbs).toFixed(1)} lb/week` : ""}. Protein consistency is ${Math.round(w.proteinConsistency * 100)}% — that's what keeps this weight loss instead of muscle loss.`
          : `One weigh-in is noise; the weekly average is signal. Stay consistent for a few more days before drawing conclusions.`,
      suggestedCalorieDelta: null,
      suggestedProteinDelta: null,
      mealTimingSuggestion: null,
      suggestedChallengeType: w.waterConsistency < 0.5 ? "water" : null,
      confidence: "medium",
    };
  }

  // Maintenance.
  if (trend.direction === "flat" || trend.entries < 4) {
    return {
      headline: "Steady is the win",
      detail: `Weight is holding and you're logging ${Math.round(w.loggingConsistency * 100)}% of days. Maintenance doesn't make headlines — it makes health. Keep the pattern.`,
      suggestedCalorieDelta: null,
      suggestedProteinDelta: null,
      mealTimingSuggestion: null,
      suggestedChallengeType: null,
      confidence: "medium",
    };
  }
  return {
    headline: `Weight is drifting ${trend.direction}`,
    detail: `Your trend has moved ${trend.direction}${trend.weeklyRateLbs ? ` about ${Math.abs(trend.weeklyRateLbs).toFixed(1)} lb/week` : ""}. A minor adjustment of ~150 calories ${trend.direction === "up" ? "down" : "up"} should re-center you. No drastic moves.`,
    suggestedCalorieDelta: trend.direction === "up" ? -150 : 150,
    suggestedProteinDelta: null,
    mealTimingSuggestion: null,
    suggestedChallengeType: null,
    confidence: "medium",
  };
}
