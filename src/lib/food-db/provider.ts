import type { FoodItem } from "@/types";
import { searchSeedFoods } from "@/data/foods";

/* ============================================================
   Food database abstraction. The seed provider ships with the
   MVP; to add USDA FoodData Central, Open Food Facts,
   Nutritionix, or FatSecret, implement FoodDatabaseProvider
   and register it in getFoodDatabase().
   ============================================================ */

export interface FoodDatabaseProvider {
  readonly name: string;
  search(query: string): Promise<FoodItem[]>;
  lookupBarcode(barcode: string): Promise<FoodItem | null>;
}

class SeedFoodDatabase implements FoodDatabaseProvider {
  readonly name = "seed";
  async search(query: string): Promise<FoodItem[]> {
    return searchSeedFoods(query);
  }
  async lookupBarcode(): Promise<FoodItem | null> {
    // Barcode scanning is a placeholder in the MVP.
    return null;
  }
}

/* Example future provider (not implemented):
class USDAFoodDatabase implements FoodDatabaseProvider {
  readonly name = "usda";
  constructor(private apiKey: string) {}
  async search(query: string) {
    // GET https://api.nal.usda.gov/fdc/v1/foods/search?query=...&api_key=...
    // Map FDC nutrients → FoodItem
  }
}
*/

export function getFoodDatabase(): FoodDatabaseProvider {
  return new SeedFoodDatabase();
}
