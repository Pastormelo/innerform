import type { FoodItem, FoodMicros } from "@/types";

/* ============================================================
   USDA FoodData Central → FoodItem mapping.
   Free API; get a key at https://fdc.nal.usda.gov/api-key-signup.html
   and set USDA_FDC_API_KEY. Falls back to DEMO_KEY (rate-limited).
   USDA has no product images or Nutri-Score; we derive our own
   letter grade from a base-quality heuristic + goal-aware scoring.
   ============================================================ */

const FDC_BASE = "https://api.nal.usda.gov/fdc/v1";
const KEY = () => process.env.USDA_FDC_API_KEY || "DEMO_KEY";

interface FDCNutrient {
  nutrientNumber?: string;
  nutrientName?: string;
  unitName?: string;
  value?: number;
}
interface FDCFood {
  fdcId: number;
  description?: string;
  dataType?: string;
  brandName?: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  gtinUpc?: string;
  foodNutrients?: FDCNutrient[];
  ingredients?: string;
}

/** First nutrient value (per 100g) matching any of the given USDA numbers. */
function pick(nutrients: FDCNutrient[], numbers: string[]): number {
  for (const num of numbers) {
    const hit = nutrients.find((x) => x.nutrientNumber === num && typeof x.value === "number");
    if (hit) return hit.value as number;
  }
  return 0;
}

/** Heuristic 0–100 base quality from per-100g macros (USDA gives no grade). */
function baseQualityFrom(cal: number, protein: number, fiber: number, sugar: number, satFat: number): number {
  if (cal <= 0) return 60;
  const proteinDensity = (protein * 4) / cal; // fraction of cals from protein
  const q = 55 + proteinDensity * 45 + Math.min(fiber, 10) * 1.2 - Math.min(sugar, 40) * 0.5 - Math.min(satFat, 20) * 0.6;
  return Math.max(20, Math.min(96, Math.round(q)));
}

const MASS_UNITS = ["g", "grm", "gram", "ml", "mlt"];

export function mapFDCFood(food: FDCFood): FoodItem | null {
  const name = (food.description ?? "").trim();
  if (!name) return null;
  const nutrients = food.foodNutrients ?? [];

  // USDA search values are per 100g. Scale to the label serving when we have a mass serving.
  const unit = (food.servingSizeUnit ?? "").toLowerCase();
  const hasMassServing = food.servingSize && MASS_UNITS.includes(unit);
  const scale = hasMassServing ? (food.servingSize as number) / 100 : 1;
  const servingSize = hasMassServing ? (food.servingSize as number) : 100;
  const servingUnit = hasMassServing ? (unit === "mlt" ? "ml" : unit === "grm" || unit === "gram" ? "g" : unit) : "g";

  const per100 = {
    cal: pick(nutrients, ["208", "1008"]),
    protein: pick(nutrients, ["203", "1003"]),
    fat: pick(nutrients, ["204", "1004"]),
    carbs: pick(nutrients, ["205", "1005"]),
    fiber: pick(nutrients, ["291", "1079"]),
    sugar: pick(nutrients, ["269", "2000"]),
    sodium: pick(nutrients, ["307", "1093"]),
    satFat: pick(nutrients, ["606", "1258"]),
    transFat: pick(nutrients, ["605", "1257"]),
    cholesterol: pick(nutrients, ["601", "1253"]),
    calcium: pick(nutrients, ["301", "1087"]),
    iron: pick(nutrients, ["303", "1089"]),
    potassium: pick(nutrients, ["306", "1092"]),
    addedSugar: pick(nutrients, ["539", "1235"]),
  };
  const r = (v: number) => Math.round(v * scale * 10) / 10;

  const micros: FoodMicros = {
    saturatedFat: per100.satFat ? r(per100.satFat) : undefined,
    transFat: per100.transFat ? r(per100.transFat) : undefined,
    cholesterol: per100.cholesterol ? Math.round(per100.cholesterol * scale) : undefined,
    calcium: per100.calcium ? Math.round(per100.calcium * scale) : undefined,
    iron: per100.iron ? Math.round(per100.iron * scale * 10) / 10 : undefined,
    potassium: per100.potassium ? Math.round(per100.potassium * scale) : undefined,
    addedSugar: per100.addedSugar ? r(per100.addedSugar) : undefined,
  };

  return {
    id: `usda:${food.fdcId}`,
    name,
    brand: (food.brandName || food.brandOwner || null)?.trim() || null,
    servingSize,
    servingUnit,
    calories: Math.round(per100.cal * scale),
    protein: r(per100.protein),
    carbs: r(per100.carbs),
    fat: r(per100.fat),
    fiber: r(per100.fiber),
    sugar: r(per100.sugar),
    sodium: per100.sodium ? Math.round(per100.sodium * scale) : null,
    baseQuality: baseQualityFrom(per100.cal, per100.protein, per100.fiber, per100.sugar, per100.satFat),
    gainCategories: [],
    groceryCategory: "other",
    source: "usda",
    barcode: food.gtinUpc ?? null,
    createdByUserId: null,
    imageUrl: null,
    grade: null,
    ingredients: food.ingredients?.trim() || null,
    micros,
  };
}

export async function usdaSearch(query: string): Promise<FoodItem[]> {
  const url = `${FDC_BASE}/foods/search?api_key=${KEY()}&query=${encodeURIComponent(query)}&pageSize=25&dataType=${encodeURIComponent("Branded,Foundation,SR Legacy")}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(9000) });
  if (!res.ok) throw new Error(`USDA search ${res.status}`);
  const data = await res.json();
  return ((data.foods ?? []) as FDCFood[]).map(mapFDCFood).filter((x): x is FoodItem => x != null);
}

export async function usdaBarcode(barcode: string): Promise<FoodItem | null> {
  const url = `${FDC_BASE}/foods/search?api_key=${KEY()}&query=${encodeURIComponent(barcode)}&pageSize=10&dataType=Branded`;
  const res = await fetch(url, { signal: AbortSignal.timeout(9000) });
  if (!res.ok) return null;
  const data = await res.json();
  const foods = (data.foods ?? []) as FDCFood[];
  const exact = foods.find((f) => f.gtinUpc && f.gtinUpc.replace(/^0+/, "") === barcode.replace(/^0+/, ""));
  const chosen = exact ?? foods[0];
  return chosen ? mapFDCFood(chosen) : null;
}
