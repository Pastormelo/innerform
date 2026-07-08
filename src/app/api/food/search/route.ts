import { NextResponse } from "next/server";
import { usdaSearch } from "@/lib/food-db/usda";

/** GET /api/food/search?q=... — USDA FoodData Central search, mapped to FoodItem[]. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ items: [] });
  try {
    const items = await usdaSearch(q);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("USDA search failed:", err);
    return NextResponse.json({ items: [], error: "search_failed" }, { status: 200 });
  }
}
