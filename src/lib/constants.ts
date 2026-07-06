import type { ExerciseType, MealType } from "@/types";

/* ============================================================
   Shared display constants — meal types (#21), exercise, and
   food-category icons (#1). Icon names are Lucide identifiers
   resolved in components via lucide-react.
   ============================================================ */

export const MEAL_TYPES: { value: MealType; label: string; icon: string }[] = [
  { value: "breakfast", label: "Breakfast", icon: "EggFried" },
  { value: "brunch", label: "Brunch", icon: "Croissant" },
  { value: "morning_snack", label: "Morning snack", icon: "Apple" },
  { value: "lunch", label: "Lunch", icon: "Sandwich" },
  { value: "afternoon_snack", label: "Afternoon snack", icon: "Cookie" },
  { value: "pre_workout", label: "Pre-workout", icon: "Zap" },
  { value: "post_workout", label: "Post-workout", icon: "Dumbbell" },
  { value: "dinner", label: "Dinner", icon: "UtensilsCrossed" },
  { value: "evening_snack", label: "Evening snack", icon: "Popcorn" },
  { value: "late_night", label: "Late night", icon: "Moon" },
  { value: "snack", label: "Snack", icon: "Cookie" },
  { value: "custom", label: "Custom", icon: "Plus" },
];

export function mealTypeLabel(t: MealType): string {
  return MEAL_TYPES.find((m) => m.value === t)?.label ?? t.replace(/_/g, " ");
}
export function mealTypeIcon(t: MealType): string {
  return MEAL_TYPES.find((m) => m.value === t)?.icon ?? "UtensilsCrossed";
}

/** The core meal slots most days use, in order. */
export const CORE_MEAL_ORDER: MealType[] = [
  "breakfast",
  "brunch",
  "morning_snack",
  "lunch",
  "afternoon_snack",
  "pre_workout",
  "post_workout",
  "dinner",
  "evening_snack",
  "late_night",
  "snack",
  "custom",
];

/* ---- Exercise (#20) ---- */

export const EXERCISE_TYPES: { value: ExerciseType; label: string; icon: string; met: number }[] = [
  { value: "walk", label: "Walk", icon: "Footprints", met: 3.5 },
  { value: "run", label: "Run", icon: "Rabbit", met: 9.8 },
  { value: "cycle", label: "Cycle", icon: "Bike", met: 7.5 },
  { value: "cardio", label: "Cardio", icon: "HeartPulse", met: 7.0 },
  { value: "strength", label: "Strength", icon: "Dumbbell", met: 5.0 },
  { value: "swim", label: "Swim", icon: "Waves", met: 8.0 },
  { value: "sport", label: "Sport", icon: "Trophy", met: 7.0 },
  { value: "other", label: "Other", icon: "Activity", met: 5.0 },
];

/** MET-based calorie estimate: kcal = MET * 3.5 * kg / 200 * minutes. */
export function estimateCaloriesBurned(type: ExerciseType, minutes: number, weightLbs: number): number {
  const met = EXERCISE_TYPES.find((e) => e.value === type)?.met ?? 5;
  const kg = weightLbs / 2.20462;
  return Math.round(((met * 3.5 * kg) / 200) * minutes);
}

/* ---- Food category icons (#1) ---- */

import type { GainCategory, GroceryCategory } from "@/types";

const GROCERY_ICON: Record<GroceryCategory, string> = {
  produce: "Carrot",
  meat_seafood: "Beef",
  dairy: "Milk",
  grains: "Wheat",
  pantry: "Soup",
  frozen: "Snowflake",
  snacks: "Cookie",
  supplements: "Pill",
  other: "Utensils",
};

/** Pick the most representative Lucide icon for a food. */
export function foodIcon(opts: { groceryCategory?: GroceryCategory; gainCategories?: GainCategory[]; name?: string }): string {
  const n = (opts.name ?? "").toLowerCase();
  if (/smoothie|shake|milk|latte|juice|drink/.test(n)) return "CupSoda";
  if (/egg/.test(n)) return "EggFried";
  if (/coffee/.test(n)) return "Coffee";
  if (/banana|apple|fruit|berry|orange/.test(n)) return "Apple";
  if (opts.gainCategories?.includes("liquid_calories")) return "CupSoda";
  if (opts.gainCategories?.includes("protein_anchor")) return "Beef";
  return GROCERY_ICON[opts.groceryCategory ?? "other"] ?? "Utensils";
}

/* ---- Nutri-Score grade colors (#15) ---- */

export const GRADE_COLORS: Record<string, string> = {
  A: "#2E8B57",
  B: "#7CB342",
  C: "#E8A83E",
  D: "#EF7B24",
  E: "#C0392B",
};

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
