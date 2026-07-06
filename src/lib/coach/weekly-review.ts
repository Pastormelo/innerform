import type { CoachContext, WeeklyReview } from "@/types";
import { goalDirection } from "@/lib/nutrition/calculations";

/* ============================================================
   Weekly review — an end-of-week summary the coach generates
   from the last 7 days: adherence, averages, consistency, trend,
   wins, and the single most useful fix for next week.
   ============================================================ */

export function generateWeeklyReview(ctx: CoachContext): WeeklyReview {
  const days = ctx.recentDays.slice(0, 7);
  const logged = days.filter((d) => d.mealsLogged > 0);
  const n = Math.max(logged.length, 1);
  const dir = goalDirection(ctx.profile.primaryGoal);

  const avgCalories = Math.round(logged.reduce((s, d) => s + d.calories, 0) / n);
  const targetCalories = logged[0]?.targetCalories ?? days[0]?.targetCalories ?? 2000;
  const proteinHit = logged.filter((d) => d.protein >= d.targetProtein * 0.9).length;
  const waterHit = logged.filter((d) => d.waterOz >= d.targetWaterOz * 0.9).length;
  const proteinConsistencyPct = Math.round((proteinHit / n) * 100);
  const waterConsistencyPct = Math.round((waterHit / n) * 100);

  const best = [...logged].sort((a, b) => Math.abs(a.calories - a.targetCalories) - Math.abs(b.calories - b.targetCalories))[0];

  const wins: string[] = [];
  if (logged.length >= 5) wins.push(`Logged ${logged.length} of 7 days`);
  if (proteinConsistencyPct >= 70) wins.push(`Protein on point ${proteinConsistencyPct}% of days`);
  if (waterConsistencyPct >= 70) wins.push(`Hydration held ${waterConsistencyPct}% of days`);
  const totalBurned = logged.reduce((s, d) => s + d.caloriesBurned, 0);
  if (totalBurned > 0) wins.push(`${totalBurned.toLocaleString()} kcal burned through exercise`);
  if (wins.length === 0) wins.push("You showed up and opened the app — that's the first rep");

  const avgGap = avgCalories - targetCalories;
  let oneFix: string;
  if (logged.length < 4) oneFix = "Log at least 5 days next week. Consistency of logging comes before consistency of eating.";
  else if (dir === "gain" && avgGap < -300) oneFix = `You averaged ${Math.abs(avgGap)} under target. Add one repeatable 500-calorie addition — a smoothie or a booster on every plate.`;
  else if (dir === "loss" && avgGap > 300) oneFix = `You averaged ${avgGap} over target. Pick the one meal that keeps blowing up and pre-plan it.`;
  else if (proteinConsistencyPct < 60) oneFix = "Anchor your first meal with 35g of protein. It's the highest-leverage change you can make.";
  else if (waterConsistencyPct < 50) oneFix = "Tie water to your meals — a glass with each. Small, boring, effective.";
  else oneFix = "Keep doing exactly this. Don't fix what's working — just protect the streak.";

  const headline =
    logged.length >= 5 && proteinConsistencyPct >= 70
      ? "A strong week. This is the pattern."
      : logged.length >= 3
        ? "A workable week with one clear lever."
        : "A quiet week — next week we build the habit.";

  return {
    weekLabel: `${days[days.length - 1]?.date ?? ""} – ${days[0]?.date ?? ""}`,
    daysLogged: logged.length,
    avgCalories,
    targetCalories,
    proteinConsistencyPct,
    waterConsistencyPct,
    weightChangeLbs: ctx.weightTrend.weeklyRateLbs,
    bestDay: best?.date ?? null,
    wins,
    oneFix,
    headline,
  };
}
