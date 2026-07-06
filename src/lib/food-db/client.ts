"use client";

import type { FoodItem } from "@/types";
import { searchSeedFoods } from "@/data/foods";

/* ============================================================
   Client-side food lookup. Always returns the seed catalog
   first (instant, offline), then merges Open Food Facts results
   from the API route. Barcode goes straight to OFF.
   ============================================================ */

export async function searchFoods(query: string): Promise<{ seed: FoodItem[]; remote: FoodItem[] }> {
  const seed = searchSeedFoods(query);
  if (!query.trim()) return { seed, remote: [] };
  try {
    const res = await fetch(`/api/food/search?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(9000) });
    const data = await res.json();
    return { seed, remote: (data.items ?? []) as FoodItem[] };
  } catch {
    return { seed, remote: [] };
  }
}

export async function lookupBarcode(code: string): Promise<FoodItem | null> {
  try {
    const res = await fetch(`/api/food/barcode?code=${encodeURIComponent(code)}`, { signal: AbortSignal.timeout(9000) });
    const data = await res.json();
    return (data.item ?? null) as FoodItem | null;
  } catch {
    return null;
  }
}
