import { NextResponse } from "next/server";
import { offBarcode } from "@/lib/food-db/openfoodfacts";

/** GET /api/food/barcode?code=... — Open Food Facts barcode lookup. */
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code")?.trim();
  if (!code) return NextResponse.json({ item: null });
  try {
    const item = await offBarcode(code);
    return NextResponse.json({ item });
  } catch (err) {
    console.error("OFF barcode failed:", err);
    return NextResponse.json({ item: null, error: "lookup_failed" }, { status: 200 });
  }
}
