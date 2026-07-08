import { NextResponse } from "next/server";
import { usdaBarcode } from "@/lib/food-db/usda";

/** GET /api/food/barcode?code=... — USDA FoodData Central branded lookup by UPC. */
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code")?.trim();
  if (!code) return NextResponse.json({ item: null });
  try {
    const item = await usdaBarcode(code);
    return NextResponse.json({ item });
  } catch (err) {
    console.error("USDA barcode failed:", err);
    return NextResponse.json({ item: null, error: "lookup_failed" }, { status: 200 });
  }
}
