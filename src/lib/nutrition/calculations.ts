import type { ActivityLevel, DesiredPace, GoalDirection, GoalType, Sex } from "@/types";

/* ============================================================
   Nutrition math — Mifflin-St Jeor BMR, activity-scaled TDEE,
   goal-adjusted calorie & macro targets. All weights in lbs,
   heights in inches internally.
   ============================================================ */

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const LBS_PER_KG = 2.20462;
const IN_PER_CM = 0.393701;

export const lbsToKg = (lbs: number) => lbs / LBS_PER_KG;
export const kgToLbs = (kg: number) => kg * LBS_PER_KG;
export const inToCm = (inches: number) => inches / IN_PER_CM;
export const cmToIn = (cm: number) => cm * IN_PER_CM;

export function goalDirection(goal: GoalType): GoalDirection {
  switch (goal) {
    case "lose_weight":
      return "loss";
    case "gain_weight":
    case "build_muscle":
      return "gain";
    default:
      return "maintain";
  }
}

export function mifflinStJeorBMR(sex: Sex, weightLbs: number, heightIn: number, age: number): number {
  const kg = lbsToKg(weightLbs);
  const cm = inToCm(heightIn);
  const base = 10 * kg + 6.25 * cm - 5 * age;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

export function tdee(bmr: number, activity: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activity]);
}

/** Daily calorie delta from maintenance for a goal + pace. */
export function calorieDelta(direction: GoalDirection, pace: DesiredPace): number {
  if (direction === "maintain") return 0;
  const magnitude = { slow: 250, moderate: 450, aggressive: 650 }[pace];
  return direction === "loss" ? -magnitude : magnitude;
}

export interface ComputedTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterOz: number;
  maintenance: number;
}

const SAFE_MIN_CALORIES: Record<Sex, number> = { male: 1500, female: 1200 };

export function computeTargets(profile: {
  sex: Sex | null;
  age: number | null;
  heightIn: number | null;
  currentWeight: number | null;
  activityLevel: ActivityLevel;
  primaryGoal: GoalType;
  desiredPace: DesiredPace;
}): ComputedTargets {
  const sex = profile.sex ?? "male";
  const age = profile.age ?? 30;
  const heightIn = profile.heightIn ?? 69;
  const weight = profile.currentWeight ?? 170;

  const bmr = mifflinStJeorBMR(sex, weight, heightIn, age);
  const maintenance = tdee(bmr, profile.activityLevel);
  const direction = goalDirection(profile.primaryGoal);

  let calories = maintenance + calorieDelta(direction, profile.desiredPace);
  calories = Math.max(calories, SAFE_MIN_CALORIES[sex]);

  // Protein: cutting protects muscle (1.0 g/lb), gaining builds it (0.9), maintenance 0.8.
  const proteinPerLb = direction === "loss" ? 1.0 : direction === "gain" ? 0.9 : 0.8;
  const protein = Math.round(weight * proteinPerLb);

  // Fat: 25–30% of calories.
  const fatPct = direction === "gain" ? 0.3 : 0.27;
  const fat = Math.round((calories * fatPct) / 9);

  // Carbs fill the remainder.
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  const fiber = Math.round(Math.min(38, Math.max(25, calories / 80)));
  const waterOz = Math.round(Math.min(128, Math.max(64, weight * 0.5)));

  return { calories: Math.round(calories), protein, carbs, fat, fiber, waterOz, maintenance };
}

/* ---- Display helpers ---- */

export function formatHeight(heightIn: number, units: "imperial" | "metric"): string {
  if (units === "metric") return `${Math.round(inToCm(heightIn))} cm`;
  const ft = Math.floor(heightIn / 12);
  const rem = Math.round(heightIn % 12);
  return `${ft}'${rem}"`;
}

export function formatWeight(lbs: number, units: "imperial" | "metric"): string {
  if (units === "metric") return `${(lbsToKg(lbs)).toFixed(1)} kg`;
  return `${Math.round(lbs * 10) / 10} lb`;
}
