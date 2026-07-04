import type { GoalDirection, MealType } from "@/types";

/* ============================================================
   Meal plan templates — hard-gainer and fat-loss libraries,
   plus balanced defaults. Used by the Meal Plan generator and
   shown as one-tap additions.
   ============================================================ */

export interface MealTemplate {
  id: string;
  title: string;
  description: string;
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  /** grocery items this meal implies */
  groceries: { name: string; category: import("@/types").GroceryCategory; quantity: string }[];
}

export const GAIN_TEMPLATES: MealTemplate[] = [
  {
    id: "hc-smoothie",
    title: "High-Calorie Smoothie",
    description: "Whey, whole milk, banana, peanut butter, oats. 700+ calories that don't fight your appetite.",
    mealType: "snack",
    calories: 720,
    protein: 42,
    carbs: 68,
    fat: 30,
    tags: ["liquid calories", "hard gainer", "fast"],
    groceries: [
      { name: "Whey protein", category: "supplements", quantity: "1 tub" },
      { name: "Whole milk", category: "dairy", quantity: "1 gal" },
      { name: "Bananas", category: "produce", quantity: "6" },
      { name: "Peanut butter", category: "pantry", quantity: "1 jar" },
      { name: "Oats", category: "grains", quantity: "1 canister" },
    ],
  },
  {
    id: "cd-breakfast",
    title: "Calorie-Dense Breakfast",
    description: "3 eggs with cheese, bagel with peanut butter, whole milk. Starts the day 900 ahead.",
    mealType: "breakfast",
    calories: 910,
    protein: 45,
    carbs: 75,
    fat: 45,
    tags: ["hard gainer", "breakfast"],
    groceries: [
      { name: "Eggs", category: "dairy", quantity: "1 dozen" },
      { name: "Cheddar cheese", category: "dairy", quantity: "8 oz" },
      { name: "Bagels", category: "grains", quantity: "6" },
      { name: "Peanut butter", category: "pantry", quantity: "1 jar" },
      { name: "Whole milk", category: "dairy", quantity: "1 gal" },
    ],
  },
  {
    id: "portable-snack",
    title: "Portable Snack Pack",
    description: "Trail mix, protein bar, banana. 500 calories that travel with you.",
    mealType: "snack",
    calories: 490,
    protein: 27,
    carbs: 55,
    fat: 20,
    tags: ["portable", "hard gainer"],
    groceries: [
      { name: "Trail mix", category: "snacks", quantity: "1 bag" },
      { name: "Protein bars", category: "snacks", quantity: "1 box" },
      { name: "Bananas", category: "produce", quantity: "6" },
    ],
  },
  {
    id: "late-night",
    title: "Late-Night Easy Calories",
    description: "Greek yogurt with granola and honey. Low effort, 450 calories, protein before sleep.",
    mealType: "snack",
    calories: 450,
    protein: 26,
    carbs: 58,
    fat: 13,
    tags: ["late night", "easy"],
    groceries: [
      { name: "Greek yogurt", category: "dairy", quantity: "32 oz" },
      { name: "Granola", category: "grains", quantity: "1 bag" },
      { name: "Honey", category: "pantry", quantity: "1 bottle" },
    ],
  },
  {
    id: "low-volume-dinner",
    title: "Low-Volume High-Calorie Bowl",
    description: "Ground beef over rice with olive oil stirred in, avocado on top. ~950 calories in one bowl.",
    mealType: "dinner",
    calories: 950,
    protein: 42,
    carbs: 70,
    fat: 52,
    tags: ["hard gainer", "dinner", "low volume"],
    groceries: [
      { name: "Ground beef", category: "meat_seafood", quantity: "2 lb" },
      { name: "White rice", category: "grains", quantity: "2 lb" },
      { name: "Olive oil", category: "pantry", quantity: "1 bottle" },
      { name: "Avocados", category: "produce", quantity: "3" },
    ],
  },
  {
    id: "busy-day",
    title: "Busy Day Survival Plan",
    description: "Smoothie at 9, PB sandwich + milk at 1, trail mix at 4, easy pasta dinner. Hits ~3,100 without cooking twice.",
    mealType: "custom",
    calories: 3100,
    protein: 150,
    carbs: 330,
    fat: 120,
    tags: ["full day", "hard gainer", "busy"],
    groceries: [
      { name: "Whey protein", category: "supplements", quantity: "1 tub" },
      { name: "Whole milk", category: "dairy", quantity: "1 gal" },
      { name: "Bread", category: "grains", quantity: "1 loaf" },
      { name: "Peanut butter", category: "pantry", quantity: "1 jar" },
      { name: "Trail mix", category: "snacks", quantity: "1 bag" },
      { name: "Pasta", category: "grains", quantity: "1 lb" },
      { name: "Ground beef", category: "meat_seafood", quantity: "1 lb" },
    ],
  },
];

export const LOSS_TEMPLATES: MealTemplate[] = [
  {
    id: "hp-breakfast",
    title: "High-Protein Breakfast",
    description: "Greek yogurt bowl with berries, or 3-egg scramble. 35g protein before the day gets loud.",
    mealType: "breakfast",
    calories: 380,
    protein: 36,
    carbs: 30,
    fat: 13,
    tags: ["protein", "cutting"],
    groceries: [
      { name: "Greek yogurt", category: "dairy", quantity: "32 oz" },
      { name: "Eggs", category: "dairy", quantity: "1 dozen" },
      { name: "Berries", category: "produce", quantity: "1 pint" },
    ],
  },
  {
    id: "hf-lunch",
    title: "High-Fiber Lunch",
    description: "Chicken breast, big salad, beans or potato. Fiber + protein = the 3 PM cravings never show.",
    mealType: "lunch",
    calories: 480,
    protein: 42,
    carbs: 48,
    fat: 12,
    tags: ["fiber", "cutting"],
    groceries: [
      { name: "Chicken breast", category: "meat_seafood", quantity: "2 lb" },
      { name: "Salad greens", category: "produce", quantity: "1 bag" },
      { name: "Black beans", category: "pantry", quantity: "2 cans" },
      { name: "Potatoes", category: "produce", quantity: "5 lb" },
    ],
  },
  {
    id: "lv-dinner",
    title: "Low-Calorie High-Volume Dinner",
    description: "Salmon or chicken with a mountain of roasted broccoli and potatoes. A full plate for under 550.",
    mealType: "dinner",
    calories: 540,
    protein: 45,
    carbs: 50,
    fat: 16,
    tags: ["volume", "cutting", "dinner"],
    groceries: [
      { name: "Salmon", category: "meat_seafood", quantity: "1 lb" },
      { name: "Broccoli", category: "produce", quantity: "2 heads" },
      { name: "Potatoes", category: "produce", quantity: "5 lb" },
    ],
  },
  {
    id: "planned-snack",
    title: "Planned Snack",
    description: "Apple with cheese stick, or yogurt cup. Planned beats improvised every time.",
    mealType: "snack",
    calories: 180,
    protein: 10,
    carbs: 26,
    fat: 6,
    tags: ["snack", "cutting"],
    groceries: [
      { name: "Apples", category: "produce", quantity: "6" },
      { name: "Cheese sticks", category: "dairy", quantity: "1 pack" },
    ],
  },
  {
    id: "restaurant-plan",
    title: "Restaurant Control Plan",
    description: "Protein + vegetable entree, skip the bread basket, one drink max, log it before you order.",
    mealType: "dinner",
    calories: 700,
    protein: 45,
    carbs: 50,
    fat: 30,
    tags: ["eating out", "strategy"],
    groceries: [],
  },
  {
    id: "weekend-plan",
    title: "Weekend Plan",
    description: "Pre-log Saturday breakfast and dinner Friday night. The weekend is won before it starts.",
    mealType: "custom",
    calories: 1900,
    protein: 140,
    carbs: 180,
    fat: 65,
    tags: ["weekend", "strategy"],
    groceries: [],
  },
];

export const BALANCED_TEMPLATES: MealTemplate[] = [
  {
    id: "balanced-breakfast",
    title: "Balanced Breakfast",
    description: "Oats with Greek yogurt and banana. Steady fuel, no crash.",
    mealType: "breakfast",
    calories: 420,
    protein: 30,
    carbs: 60,
    fat: 8,
    tags: ["balanced"],
    groceries: [
      { name: "Oats", category: "grains", quantity: "1 canister" },
      { name: "Greek yogurt", category: "dairy", quantity: "32 oz" },
      { name: "Bananas", category: "produce", quantity: "6" },
    ],
  },
  {
    id: "balanced-lunch",
    title: "Protein Bowl",
    description: "Chicken, rice, avocado, greens. The default lunch that never fails.",
    mealType: "lunch",
    calories: 620,
    protein: 45,
    carbs: 60,
    fat: 22,
    tags: ["balanced"],
    groceries: [
      { name: "Chicken breast", category: "meat_seafood", quantity: "2 lb" },
      { name: "White rice", category: "grains", quantity: "2 lb" },
      { name: "Avocados", category: "produce", quantity: "3" },
      { name: "Salad greens", category: "produce", quantity: "1 bag" },
    ],
  },
  {
    id: "balanced-dinner",
    title: "Simple Dinner",
    description: "Ground beef pasta with a side of broccoli. Repeatable, family-friendly.",
    mealType: "dinner",
    calories: 680,
    protein: 42,
    carbs: 68,
    fat: 26,
    tags: ["balanced", "family"],
    groceries: [
      { name: "Ground beef", category: "meat_seafood", quantity: "1 lb" },
      { name: "Pasta", category: "grains", quantity: "1 lb" },
      { name: "Broccoli", category: "produce", quantity: "2 heads" },
    ],
  },
];

export function templatesForGoal(direction: GoalDirection): MealTemplate[] {
  if (direction === "gain") return [...GAIN_TEMPLATES, ...BALANCED_TEMPLATES];
  if (direction === "loss") return [...LOSS_TEMPLATES, ...BALANCED_TEMPLATES];
  return [...BALANCED_TEMPLATES, ...LOSS_TEMPLATES.slice(0, 3)];
}
