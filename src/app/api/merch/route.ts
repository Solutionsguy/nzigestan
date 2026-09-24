import { NextResponse } from "next/server";
import { getServerStore, addMerchProduct, updateMerchProduct, deleteMerchProduct } from "@/lib/serverStore";
import type { MerchProduct } from "@/types";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function GET() {
  const store = getServerStore();
  return NextResponse.json(store.merch, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}

export async function POST(req: Request) {
  if (!rateLimit(req)) {
    return rateLimitResponse(30, 60_000);
  }
  try {
    const body = await req.json();
    const newProduct: MerchProduct = {
      id: body.id || `product-${Date.now()}`,
      name: body.name || "Untitled Merch Drop",
      tagline: body.tagline || "Official Nzigestan Drop",
      priceKes: Number(body.priceKes) || 2500,
      category: body.category || "streetwear",
      sizes: body.sizes || ["S", "M", "L", "XL"],
      stockTotal: Number(body.stockTotal) || 100,
      stockRemaining: Number(body.stockRemaining) || Number(body.stockTotal) || 100,
      image: body.image || "/assets/branding/locust-emblem.png",
    };
    const updated = addMerchProduct(newProduct);
    return NextResponse.json({ success: true, merch: updated, product: newProduct });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing product id" }, { status: 400 });
    }
    const updated = updateMerchProduct(body.id, body);
    return NextResponse.json({ success: true, merch: updated });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing product id" }, { status: 400 });
    }
    const updated = deleteMerchProduct(id);
    return NextResponse.json({ success: true, merch: updated });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
