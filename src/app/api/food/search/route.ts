import { NextResponse } from "next/server";
import { offSearch } from "@/lib/food-db/openfoodfacts";

/** GET /api/food/search?q=... — Open Food Facts search, mapped to FoodItem[]. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ items: [] });
  try {
    const items = await offSearch(q);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("OFF search failed:", err);
    return NextResponse.json({ items: [], error: "search_failed" }, { status: 200 });
  }
}
