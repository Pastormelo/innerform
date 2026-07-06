import type { FoodItem, FoodGrade } from "@/types";

/* ============================================================
   Open Food Facts → FoodItem mapping (#14 #15 #1).
   OFF is free and open (no key). We prefer per-serving nutrient
   fields, falling back to per-100g. Sodium is grams in OFF → mg.
   ============================================================ */

const OFF_BASE = "https://world.openfoodfacts.org";
const FIELDS =
  "code,product_name,brands,nutriments,serving_size,serving_quantity,image_front_small_url,image_front_url,nutriscore_grade,ingredients_text,categories_tags";

interface OFFProduct {
  code?: string;
  product_name?: string;
  brands?: string | string[];
  serving_size?: string;
  serving_quantity?: number;
  image_front_small_url?: string;
  image_front_url?: string;
  nutriscore_grade?: string;
  ingredients_text?: string;
  categories_tags?: string[];
  nutriments?: Record<string, number | string | undefined>;
}

function num(v: number | string | undefined): number {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n as number) ? (n as number) : 0;
}

function pickNutriment(n: Record<string, number | string | undefined>, base: string): { value: number; perServing: boolean } {
  const serving = n[`${base}_serving`];
  if (serving != null && num(serving) > 0) return { value: num(serving), perServing: true };
  const per100 = n[`${base}_100g`];
  return { value: num(per100), perServing: false };
}

function grade(g?: string): FoodGrade {
  const up = (g ?? "").toUpperCase();
  return (["A", "B", "C", "D", "E"].includes(up) ? up : null) as FoodGrade;
}

function groceryCategoryFrom(tags: string[] = []): FoodItem["groceryCategory"] {
  const t = tags.join(" ");
  if (/beverage|drink|milk|water|juice/.test(t)) return "dairy";
  if (/meat|fish|seafood|poultry/.test(t)) return "meat_seafood";
  if (/dairy|cheese|yogurt/.test(t)) return "dairy";
  if (/cereal|bread|pasta|rice|grain/.test(t)) return "grains";
  if (/fruit|vegetable|produce/.test(t)) return "produce";
  if (/frozen/.test(t)) return "frozen";
  if (/snack|chip|cookie|candy|chocolate/.test(t)) return "snacks";
  if (/supplement|protein-powder/.test(t)) return "supplements";
  return "pantry";
}

/** Rough 0–100 base quality from Nutri-Score so goal-aware scoring still works. */
function baseQualityFromGrade(g: FoodGrade): number {
  return { A: 90, B: 78, C: 62, D: 48, E: 34 }[g ?? "C"] ?? 60;
}

export function mapOFFProduct(p: OFFProduct): FoodItem | null {
  const name = (p.product_name ?? "").trim();
  if (!name) return null;
  const n = p.nutriments ?? {};

  const cal = pickNutriment(n, "energy-kcal");
  const perServing = cal.perServing;
  const servingSize = perServing ? p.serving_quantity ?? 1 : 100;
  const servingUnit = perServing ? "serving" : "g";

  const val = (base: string) => {
    const r = pickNutriment(n, base);
    // Keep consistent basis: if calories came per-serving but a nutrient only has 100g, that's rare; accept as-is.
    return Math.round(r.value * 10) / 10;
  };

  const g = grade(p.nutriscore_grade);
  const brand = Array.isArray(p.brands) ? p.brands[0] : p.brands?.split(",")[0];

  return {
    id: `off:${p.code ?? name}`,
    name,
    brand: brand?.trim() || null,
    servingSize,
    servingUnit: p.serving_size && perServing ? p.serving_size : servingUnit,
    calories: Math.round(cal.value),
    protein: val("proteins"),
    carbs: val("carbohydrates"),
    fat: val("fat"),
    fiber: val("fiber"),
    sugar: val("sugars"),
    sodium: Math.round(num(pickNutriment(n, "sodium").value) * 1000) || null, // g → mg
    baseQuality: baseQualityFromGrade(g),
    gainCategories: [],
    groceryCategory: groceryCategoryFrom(p.categories_tags),
    source: "open_food_facts",
    barcode: p.code ?? null,
    createdByUserId: null,
    imageUrl: p.image_front_small_url || p.image_front_url || null,
    grade: g,
    ingredients: p.ingredients_text?.trim() || null,
    micros: {
      saturatedFat: val("saturated-fat") || undefined,
      transFat: val("trans-fat") || undefined,
      addedSugar: val("added-sugars") || undefined,
      cholesterol: val("cholesterol") ? Math.round(num(pickNutriment(n, "cholesterol").value) * 1000) : undefined,
      potassium: val("potassium") ? Math.round(num(pickNutriment(n, "potassium").value) * 1000) : undefined,
      calcium: val("calcium") ? Math.round(num(pickNutriment(n, "calcium").value) * 1000) : undefined,
      iron: val("iron") ? Math.round(num(pickNutriment(n, "iron").value) * 1000) : undefined,
    },
  };
}

export async function offSearch(query: string): Promise<FoodItem[]> {
  // Use the "search-a-licious" full-text endpoint — the legacy cgi/search.pl is
  // slow/flaky and v2/search ignores free-text terms. Results come back in `hits`.
  const url = `https://search.openfoodfacts.org/search?q=${encodeURIComponent(query)}&page_size=20&fields=${FIELDS}`;
  const res = await fetch(url, { headers: { "User-Agent": "InnerForm/1.0 (nutrition coach)" }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`OFF search ${res.status}`);
  const data = await res.json();
  const rows = (data.hits ?? data.products ?? []) as OFFProduct[];
  return rows.map(mapOFFProduct).filter((x): x is FoodItem => x != null);
}

export async function offBarcode(barcode: string): Promise<FoodItem | null> {
  const url = `${OFF_BASE}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`;
  const res = await fetch(url, { headers: { "User-Agent": "InnerForm/1.0 (nutrition coach)" }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  return mapOFFProduct(data.product as OFFProduct);
}
