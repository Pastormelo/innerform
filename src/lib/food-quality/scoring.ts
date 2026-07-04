import type { FoodItem, GoalDirection, QualityResult, QualityTier } from "@/types";

/* ============================================================
   Goal-aware food quality. A food is not "good" or "bad" —
   it either fits the user's goal or it doesn't. Calorie-dense
   foods score UP for gaining; satiating high-protein/fiber
   foods score UP for cutting.
   ============================================================ */

function tierFor(score: number): QualityTier {
  if (score >= 85) return "excellent";
  if (score >= 70) return "strong";
  if (score >= 55) return "useful";
  if (score >= 40) return "limited";
  return "poor_fit";
}

export const TIER_LABELS: Record<QualityTier, string> = {
  excellent: "Excellent",
  strong: "Strong",
  useful: "Useful",
  limited: "Limited",
  poor_fit: "Poor fit",
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function scoreFoodForGoal(food: FoodItem, direction: GoalDirection): QualityResult {
  const perServing = Math.max(food.calories, 1);
  const proteinDensity = (food.protein * 4) / perServing; // fraction of calories from protein
  const calorieDensity = perServing / Math.max(food.servingSize, 0.25); // rough per-unit density
  const fiberPer100kcal = (food.fiber / perServing) * 100;
  const sugarPer100kcal = (food.sugar / perServing) * 100;

  let score = food.baseQuality;
  let label = "";

  if (direction === "loss") {
    // Reward satiety: protein + fiber. Penalize sugar and calorie density.
    score += proteinDensity * 40;
    score += Math.min(fiberPer100kcal * 3, 12);
    score -= Math.min(sugarPer100kcal * 1.2, 18);
    if (calorieDensity > 200) score -= 10;
    score = clamp(score);
    if (proteinDensity > 0.5) label = "Good protein choice";
    else if (calorieDensity > 200 && proteinDensity < 0.2) label = "Calorie dense — use intentionally";
    else if (score >= 70) label = "Strong fit for cutting";
    else if (score >= 55) label = "Useful in moderation";
    else label = "Low satiety for cutting";
  } else if (direction === "gain") {
    // Reward calorie efficiency and protein. Volume without calories is the enemy.
    const gainUseful = food.gainCategories.some((c) =>
      ["carb_base", "calorie_dense_fat", "protein_anchor", "liquid_calories", "meal_booster", "portable_snack", "budget_gain"].includes(c),
    );
    score += gainUseful ? 12 : 0;
    score += Math.min(perServing / 40, 12); // more calories per serving helps
    score += proteinDensity * 20;
    if (food.gainCategories.includes("lean_volume") && perServing < 120) score -= 18; // filling but light
    score = clamp(score);
    if (food.gainCategories.includes("liquid_calories")) label = "Liquid calories — easy to add";
    else if (food.gainCategories.includes("meal_booster")) label = "Booster — stack onto meals";
    else if (proteinDensity > 0.5) label = "Protein anchor";
    else if (score >= 70) label = "Useful for gaining";
    else if (score >= 55) label = "Fine, but not calorie-efficient";
    else label = "High volume, low calories — hard mode for gaining";
  } else {
    // Maintenance: balanced, nutrient-dense, sustainable.
    score += proteinDensity * 20;
    score += Math.min(fiberPer100kcal * 2, 8);
    score -= Math.min(sugarPer100kcal, 12);
    score = clamp(score);
    if (score >= 85) label = "Excellent for your goal";
    else if (score >= 70) label = "Solid everyday choice";
    else if (score >= 55) label = "Fine in balance";
    else label = "Not a great fit today";
  }

  return { score, tier: tierFor(score), label };
}

/** Tier → design-token color (behavior-neutral warm/cool, never moralizing red). */
export const TIER_COLORS: Record<QualityTier, string> = {
  excellent: "var(--forest-500)",
  strong: "var(--forest-400)",
  useful: "var(--fiber-500)",
  limited: "var(--warning-500)",
  poor_fit: "var(--ink-400)",
};
