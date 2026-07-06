/* ============================================================
   InnerForm — Domain types
   Mirrors the Supabase schema in supabase/schema.sql.
   ============================================================ */

export type Sex = "male" | "female";
export type Units = "imperial" | "metric";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type CookingSkill = "beginner" | "intermediate" | "advanced";
export type BudgetPreference = "tight" | "moderate" | "flexible";
export type MealPrepPreference = "none" | "some" | "heavy";
export type DesiredPace = "slow" | "moderate" | "aggressive";

export type GoalType =
  | "lose_weight"
  | "gain_weight"
  | "maintain_weight"
  | "body_recomposition"
  | "build_muscle"
  | "improve_food_quality"
  | "improve_consistency"
  | "improve_meal_prep"
  | "improve_energy"
  | "improve_confidence"
  | "improve_discipline";

/** The three calorie-direction buckets used by targets, dashboard copy, and food quality. */
export type GoalDirection = "loss" | "gain" | "maintain";

export type CoachStyle = "encouraging" | "balanced" | "no_excuses";
export type CoachMode = "celebrate" | "encourage" | "nudge" | "challenge" | "reset";

export type Theme = "basic" | "light" | "dark";

/** Which cards/metrics the user pins to the Today dashboard (#17). */
export type DashboardWidget =
  | "rings"
  | "macros"
  | "coach"
  | "water"
  | "weight"
  | "steps"
  | "calories_burned"
  | "plan"
  | "body_learning"
  | "fiber"
  | "sugar"
  | "sodium"
  | "net_calories";

export const DEFAULT_WIDGETS: DashboardWidget[] = [
  "rings",
  "macros",
  "coach",
  "steps",
  "calories_burned",
  "water",
  "weight",
  "plan",
  "body_learning",
];

/** Days of week for scheduled weigh-ins (#5). 0 = Sunday. */
export interface WeighInSchedule {
  enabled: boolean;
  days: number[];
  time: string; // HH:MM
}

export interface UserProfile {
  id: string;
  authUserId: string;
  name: string;
  age: number | null;
  sex: Sex | null;
  heightIn: number | null; // stored in inches; converted for display
  currentWeight: number | null; // lbs
  goalWeight: number | null; // lbs
  activityLevel: ActivityLevel;
  primaryGoal: GoalType;
  secondaryGoals: GoalType[];
  desiredPace: DesiredPace;
  goalDate: string | null;
  goalContext: string | null; // event/season/milestone
  triedBefore: string | null;
  coachStyle: CoachStyle;
  dietaryPreferences: string[];
  allergies: string[];
  foodsToAvoid: string[];
  cookingSkill: CookingSkill;
  mealPrepPreference: MealPrepPreference;
  budgetPreference: BudgetPreference;
  measurementUnits: Units;
  mealsPerDay: number;
  wakeTime: string | null;
  sleepTime: string | null;
  dailyRhythm: string | null;
  onboardingCompleted: boolean;
  motivationProfileCompleted: boolean;
  hardGainerProfileCompleted: boolean;
  // Added features
  photoUrl: string | null; // data URL (#8)
  theme: Theme; // (#18)
  dashboardWidgets: DashboardWidget[]; // (#17)
  stepsGoal: number; // (#12)
  exerciseAddsToBudget: boolean; // (#20)
  timestampsEnabled: boolean; // (#19)
  weighInSchedule: WeighInSchedule; // (#5)
  createdAt: string;
  updatedAt: string;
}

export interface MotivationProfile {
  id: string;
  userId: string;
  primaryWhy: string;
  deeperWhy: string;
  dreamOutcome: string;
  desiredIdentity: string;
  lifeChangeGoal: string;
  frustrationStatement: string;
  tiredOfStatement: string;
  proudMomentGoal: string;
  peopleOrPurpose: string;
  reminderWhenQuitting: string;
  pastAttempts: string;
  pastFailurePatterns: string;
  knownExcuses: string;
  biggestBarriers: string[];
  motivationStyle: string;
  accountabilityPreference: string;
  remindersThatHelp: string;
  remindersThatAnnoy: string;
  topicsToHandleCarefully: string;
  coachShouldRemindMeOfWhy: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HardGainerProfile {
  id: string;
  userId: string;
  believesFastMetabolism: boolean;
  strugglesToEatEnough: boolean;
  getsFullQuickly: boolean;
  missesMealsDueToSchedule: boolean;
  willingToEatMore: boolean;
  unsureWhichFoodsHelp: boolean;
  prefersLiquidCalories: boolean;
  needsPortableSnacks: boolean;
  strugglesWithBreakfast: boolean;
  needsLateNightCalories: boolean;
  needsSimpleMeals: boolean;
  willingToCookComplexMeals: boolean;
  preferredHighCalorieFoods: string[];
  foodsThatAreHardToEat: string[];
  appetitePattern: string;
  biggestGainBarrier: string;
  createdAt: string;
  updatedAt: string;
}

/* ---- Food ---- */

export type FoodSource = "seed" | "user" | "usda" | "open_food_facts" | "nutritionix" | "fatsecret";

/** Hard-gainer usefulness classification. */
export type GainCategory =
  | "carb_base"
  | "calorie_dense_fat"
  | "protein_anchor"
  | "liquid_calories"
  | "portable_snack"
  | "meal_booster"
  | "easy_repeat_meal"
  | "budget_gain"
  | "produce"
  | "lean_volume";

/** Nutri-Score style letter grade (from Open Food Facts or estimated). */
export type FoodGrade = "A" | "B" | "C" | "D" | "E" | null;

/** Extended micronutrients for the full food label (#15). Per serving. */
export interface FoodMicros {
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  potassium?: number;
  calcium?: number;
  iron?: number;
  vitaminD?: number;
  addedSugar?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  brand: string | null;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number | null;
  /** 0–100 intrinsic nutrition-quality estimate (goal-agnostic; goal-aware scoring layers on top) */
  baseQuality: number;
  gainCategories: GainCategory[];
  groceryCategory: GroceryCategory;
  source: FoodSource;
  barcode: string | null;
  createdByUserId: string | null;
  // Added (#1 #15)
  imageUrl?: string | null;
  grade?: FoodGrade;
  ingredients?: string | null;
  micros?: FoodMicros;
}

export type MealType =
  | "breakfast"
  | "brunch"
  | "lunch"
  | "dinner"
  | "morning_snack"
  | "afternoon_snack"
  | "evening_snack"
  | "snack"
  | "late_night"
  | "pre_workout"
  | "post_workout"
  | "custom";

export interface FoodLog {
  id: string;
  userId: string;
  logDate: string; // YYYY-MM-DD
  mealType: MealType;
  foodItemId: string | null;
  customName: string | null;
  quantity: number; // servings
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number | null;
  foodQualityScore: number | null;
  foodQualityLabel: string | null;
  notes: string | null;
  loggedAt: string | null; // ISO timestamp when logged (#19)
  imageUrl: string | null; // user- or OFF-provided photo (#1)
  createdAt: string;
}

/* ---- Exercise, steps, notes, saved meals, reminders (added features) ---- */

export type ExerciseType = "cardio" | "strength" | "walk" | "run" | "cycle" | "swim" | "sport" | "other";

export interface ExerciseLog {
  id: string;
  userId: string;
  logDate: string;
  type: ExerciseType;
  name: string;
  durationMinutes: number;
  caloriesBurned: number;
  loggedAt: string | null;
  createdAt: string;
}

export interface StepLog {
  id: string;
  userId: string;
  logDate: string;
  steps: number;
  source: "manual" | "apple_health";
  createdAt: string;
}

export interface DailyNote {
  id: string;
  userId: string;
  logDate: string;
  body: string;
  updatedAt: string;
}

/** A reusable, user-composed meal (#16) — a named bundle of food entries. */
export interface SavedMeal {
  id: string;
  userId: string;
  name: string;
  mealType: MealType;
  items: SavedMealItem[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string;
}

export interface SavedMealItem {
  foodItemId: string | null;
  customName: string | null;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number | null;
}

/** In-app encouragement / nudge shown in a feed and on app open (#6). */
export interface Reminder {
  id: string;
  userId: string;
  createdAt: string;
  kind: "encouragement" | "log_nudge" | "water_nudge" | "weigh_in" | "activity_nudge" | "behind_nudge";
  message: string;
  read: boolean;
  actionHref: string | null;
}

export interface DailyTargets {
  id: string;
  userId: string;
  targetDate: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterOz: number;
}

export interface WaterLog {
  id: string;
  userId: string;
  logDate: string;
  amountOz: number;
  createdAt: string;
}

export interface WeighIn {
  id: string;
  userId: string;
  weight: number; // lbs
  logDate: string;
  notes: string | null;
  createdAt: string;
}

/* ---- Meal planning ---- */

export interface MealPlan {
  id: string;
  userId: string;
  weekStartDate: string;
  title: string;
  notes: string | null;
}

export interface PlannedMeal {
  id: string;
  userId: string;
  mealPlanId: string;
  plannedDate: string;
  mealType: MealType;
  title: string;
  description: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recipeId: string | null;
  completed: boolean;
}

export interface Recipe {
  id: string;
  userId: string | null;
  title: string;
  description: string;
  instructions: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  tags: string[];
  ingredients: RecipeIngredient[];
}

export interface RecipeIngredient {
  name: string;
  quantity: string;
  groceryCategory: GroceryCategory;
}

export type GroceryCategory =
  | "produce"
  | "meat_seafood"
  | "dairy"
  | "grains"
  | "pantry"
  | "frozen"
  | "snacks"
  | "supplements"
  | "other";

export interface GroceryList {
  id: string;
  userId: string;
  title: string;
  weekStartDate: string;
}

export interface GroceryItem {
  id: string;
  groceryListId: string;
  name: string;
  category: GroceryCategory;
  quantity: string;
  checked: boolean;
}

/* ---- Coaching ---- */

export interface CoachMessage {
  id: string;
  userId: string;
  role: "coach" | "user";
  message: string;
  coachStyle: CoachStyle | null;
  mode: CoachMode | null;
  source: "chat" | "daily" | "weekly_review" | "system";
  suggestedAction: string | null;
  createdAt: string;
}

export type ChallengeStatus = "active" | "completed" | "failed" | "skipped";

export interface Challenge {
  id: string;
  userId: string;
  title: string;
  description: string;
  challengeType: string;
  startDate: string;
  endDate: string;
  targetValue: number;
  currentValue: number;
  status: ChallengeStatus;
  rewardBadge: string; // badge key
}

export interface Badge {
  id: string;
  userId: string;
  badgeKey: string;
  title: string;
  description: string;
  earnedAt: string;
}

export type StreakType = "logging" | "protein" | "water" | "meal_prep" | "weigh_in";

export interface Streak {
  id: string;
  userId: string;
  streakType: StreakType;
  currentCount: number;
  bestCount: number;
  lastUpdatedDate: string | null;
}

export type HealthProvider = "apple_health" | "health_connect" | "fitbit" | "garmin" | "smart_scale";

export interface HealthIntegration {
  id: string;
  userId: string;
  provider: HealthProvider;
  connected: boolean;
  lastSyncAt: string | null;
}

export interface Recommendation {
  id: string;
  userId: string;
  recommendationType:
    | "calorie_adjustment"
    | "protein_adjustment"
    | "meal_timing"
    | "challenge"
    | "weekly_insight"
    | "food_strategy";
  title: string;
  description: string;
  priority: 1 | 2 | 3;
  status: "new" | "seen" | "applied" | "dismissed";
  createdAt: string;
}

/* ---- Coach service I/O ---- */

export interface DayStats {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  waterOz: number;
  steps: number;
  caloriesBurned: number;
  mealsLogged: number;
  loggedMealTypes: MealType[];
  targetCalories: number;
  targetProtein: number;
  targetWaterOz: number;
  /** target adjusted for exercise when exerciseAddsToBudget is on */
  effectiveTargetCalories: number;
}

export interface CoachContext {
  profile: UserProfile;
  motivation: MotivationProfile | null;
  hardGainer: HardGainerProfile | null;
  recentDays: DayStats[]; // most recent first
  weightTrend: WeightTrend;
  streaks: Streak[];
  activeChallenges: Challenge[];
  userQuestion?: string;
}

export interface WeightTrend {
  direction: "up" | "down" | "flat" | "unknown";
  weeklyRateLbs: number | null;
  latestWeight: number | null;
  entries: number;
}

export interface CoachReply {
  message: string;
  mode: CoachMode;
  suggestedAction: string | null;
  challenge: Omit<Challenge, "id" | "userId" | "status" | "currentValue"> | null;
}

/* ---- Food quality ---- */

export type QualityTier = "excellent" | "strong" | "useful" | "limited" | "poor_fit";

export interface QualityResult {
  score: number; // 0–100
  tier: QualityTier;
  label: string; // goal-aware, e.g. "Useful for gaining"
}

/* ---- Body learning ---- */

export interface BodyLearningInsight {
  headline: string;
  detail: string;
  suggestedCalorieDelta: number | null;
  suggestedProteinDelta: number | null;
  mealTimingSuggestion: string | null;
  suggestedChallengeType: string | null;
  confidence: "low" | "medium" | "high";
}
