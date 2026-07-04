import type { FoodItem } from "@/types";

/* ============================================================
   Seed food database (v1). Nutrition values are typical
   label/USDA estimates per serving. Replace or augment via a
   real provider (USDA FDC, Open Food Facts…) — see lib/food-db.
   ============================================================ */

const f = (
  id: string,
  name: string,
  servingSize: number,
  servingUnit: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  fiber: number,
  sugar: number,
  sodium: number | null,
  baseQuality: number,
  gainCategories: FoodItem["gainCategories"],
  groceryCategory: FoodItem["groceryCategory"],
): FoodItem => ({
  id,
  name,
  brand: null,
  servingSize,
  servingUnit,
  calories,
  protein,
  carbs,
  fat,
  fiber,
  sugar,
  sodium,
  baseQuality,
  gainCategories,
  groceryCategory,
  source: "seed",
  barcode: null,
  createdByUserId: null,
});

export const SEED_FOODS: FoodItem[] = [
  f("eggs", "Eggs (large)", 2, "eggs", 140, 12, 1, 10, 0, 0, 140, 85, ["protein_anchor", "budget_gain", "easy_repeat_meal"], "dairy"),
  f("chicken-breast", "Chicken breast (cooked)", 4, "oz", 187, 35, 0, 4, 0, 0, 84, 92, ["protein_anchor", "lean_volume"], "meat_seafood"),
  f("chicken-thighs", "Chicken thighs (cooked)", 4, "oz", 232, 28, 0, 13, 0, 0, 95, 84, ["protein_anchor", "budget_gain"], "meat_seafood"),
  f("ground-beef", "Ground beef 85/15 (cooked)", 4, "oz", 284, 28, 0, 18, 0, 0, 82, 78, ["protein_anchor", "budget_gain", "easy_repeat_meal"], "meat_seafood"),
  f("steak", "Sirloin steak (cooked)", 6, "oz", 340, 46, 0, 16, 0, 0, 106, 82, ["protein_anchor"], "meat_seafood"),
  f("turkey", "Turkey breast (sliced)", 3, "oz", 90, 18, 2, 1, 0, 1, 620, 78, ["protein_anchor", "lean_volume", "portable_snack"], "meat_seafood"),
  f("salmon", "Salmon (cooked)", 4, "oz", 233, 25, 0, 14, 0, 0, 69, 95, ["protein_anchor", "calorie_dense_fat"], "meat_seafood"),
  f("rice", "White rice (cooked)", 1, "cup", 205, 4, 45, 0, 1, 0, 2, 68, ["carb_base", "budget_gain", "easy_repeat_meal"], "grains"),
  f("pasta", "Pasta (cooked)", 1.5, "cups", 331, 12, 65, 2, 4, 2, 2, 66, ["carb_base", "budget_gain", "easy_repeat_meal"], "grains"),
  f("oats", "Oats (dry)", 0.5, "cup", 150, 5, 27, 3, 4, 1, 0, 88, ["carb_base", "budget_gain", "liquid_calories"], "grains"),
  f("granola", "Granola", 0.5, "cup", 240, 6, 32, 10, 4, 10, 60, 62, ["carb_base", "meal_booster", "portable_snack"], "grains"),
  f("bagel", "Bagel (plain)", 1, "bagel", 280, 11, 56, 1, 2, 6, 430, 55, ["carb_base", "portable_snack", "budget_gain"], "grains"),
  f("bread", "Whole wheat bread", 2, "slices", 160, 8, 28, 2, 4, 4, 230, 70, ["carb_base", "budget_gain"], "grains"),
  f("tortilla", "Flour tortilla (large)", 1, "tortilla", 210, 6, 36, 5, 2, 1, 490, 52, ["carb_base", "meal_booster"], "grains"),
  f("potatoes", "Potatoes (baked)", 1, "medium", 161, 4, 37, 0, 4, 2, 17, 82, ["carb_base", "budget_gain", "lean_volume"], "produce"),
  f("banana", "Banana", 1, "medium", 105, 1, 27, 0, 3, 14, 1, 80, ["carb_base", "portable_snack", "liquid_calories"], "produce"),
  f("apple", "Apple", 1, "medium", 95, 0, 25, 0, 4, 19, 2, 82, ["portable_snack", "lean_volume"], "produce"),
  f("broccoli", "Broccoli (cooked)", 1, "cup", 55, 4, 11, 0, 5, 2, 64, 96, ["produce", "lean_volume"], "produce"),
  f("avocado", "Avocado", 0.5, "avocado", 160, 2, 9, 15, 7, 0, 7, 90, ["calorie_dense_fat", "meal_booster"], "produce"),
  f("olive-oil", "Olive oil", 1, "tbsp", 119, 0, 0, 14, 0, 0, 0, 85, ["calorie_dense_fat", "meal_booster"], "pantry"),
  f("peanut-butter", "Peanut butter", 2, "tbsp", 190, 8, 7, 16, 2, 3, 140, 74, ["calorie_dense_fat", "meal_booster", "portable_snack", "budget_gain"], "pantry"),
  f("almond-butter", "Almond butter", 2, "tbsp", 196, 7, 6, 18, 3, 2, 2, 78, ["calorie_dense_fat", "meal_booster"], "pantry"),
  f("mixed-nuts", "Mixed nuts", 0.25, "cup", 203, 6, 7, 18, 2, 1, 90, 76, ["calorie_dense_fat", "portable_snack"], "snacks"),
  f("trail-mix", "Trail mix", 0.25, "cup", 173, 5, 17, 11, 2, 10, 60, 60, ["portable_snack", "calorie_dense_fat"], "snacks"),
  f("cheese", "Cheddar cheese", 1, "oz", 114, 7, 1, 9, 0, 0, 180, 66, ["calorie_dense_fat", "meal_booster", "portable_snack"], "dairy"),
  f("cheese-stick", "Cheese stick (mozzarella)", 1, "stick", 80, 7, 1, 6, 0, 0, 200, 68, ["portable_snack"], "dairy"),
  f("greek-yogurt", "Greek yogurt (plain, 2%)", 1, "cup", 190, 22, 9, 5, 0, 8, 85, 90, ["protein_anchor", "liquid_calories", "easy_repeat_meal"], "dairy"),
  f("cottage-cheese", "Cottage cheese (2%)", 1, "cup", 183, 24, 11, 5, 0, 9, 746, 84, ["protein_anchor"], "dairy"),
  f("whole-milk", "Whole milk", 1, "cup", 149, 8, 12, 8, 0, 12, 105, 72, ["liquid_calories", "meal_booster", "budget_gain"], "dairy"),
  f("whey-protein", "Whey protein (1 scoop)", 1, "scoop", 120, 24, 3, 1, 0, 2, 130, 85, ["protein_anchor", "liquid_calories", "portable_snack"], "supplements"),
  f("protein-bar", "Protein bar", 1, "bar", 210, 20, 22, 8, 3, 6, 200, 62, ["portable_snack"], "snacks"),
  f("dried-fruit", "Dried fruit (raisins)", 0.25, "cup", 108, 1, 29, 0, 1, 21, 4, 58, ["portable_snack", "meal_booster"], "snacks"),
  f("turkey-sandwich", "Turkey sandwich", 1, "sandwich", 330, 22, 40, 9, 4, 5, 900, 65, ["easy_repeat_meal", "portable_snack"], "other"),
  f("protein-smoothie", "Protein smoothie (whey, banana, PB, whole milk)", 1, "smoothie", 520, 34, 46, 22, 5, 28, 260, 76, ["liquid_calories", "easy_repeat_meal"], "other"),
  f("oat-smoothie", "Oat smoothie (oats, milk, banana, honey)", 1, "smoothie", 440, 15, 74, 10, 7, 34, 140, 70, ["liquid_calories", "carb_base"], "other"),
  f("cereal", "Cereal (whole grain)", 1, "cup", 210, 5, 42, 3, 5, 9, 190, 58, ["carb_base", "budget_gain"], "grains"),
];

export function getFoodById(id: string): FoodItem | undefined {
  return SEED_FOODS.find((x) => x.id === id);
}

/** Simple local search — the shape a real food-DB provider will implement. */
export function searchSeedFoods(query: string): FoodItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return SEED_FOODS;
  return SEED_FOODS.filter((x) => x.name.toLowerCase().includes(q));
}
