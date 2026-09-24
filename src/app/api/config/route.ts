import { NextResponse } from "next/server";
import {
  getServerStore,
  updateConfig,
  setTickerTerms,
  addTickerTerm,
  removeTickerTerm,
  reorderTickerTerms,
  addPromoCode,
  updatePromoCode,
  deletePromoCode,
  updateOrderStatus,
  pinDonorShoutout,
  addDonor,
  addOrder,
} from "@/lib/serverStore";
import {
  getSiteConfig,
  getTickerTerms as getTickerTermsDb,
  getPromoCodes as getPromoCodesDb,
  getOrders,
  getDonors,
} from "@/lib/dbService";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();

  // Try database first
  if (db) {
    try {
      const [config, tickerTerms, promoCodes, orders, donors] = await Promise.all([
        getSiteConfig(),
        getTickerTermsDb().then((t: Array<{ term: string }>) => t.map((item) => item.term)),
        getPromoCodesDb().then((p: Array<{ code: string; type: string; value: unknown; expiresAt?: Date | null; maxUses?: number | null; max_uses?: number | null; usedCount?: number; used_count?: number; minSpendKes?: number | null; min_spendKes?: number | null; isActive?: boolean; is_active?: boolean }>) => {
          const result: Record<string, unknown> = {};
          for (const item of p) {
            result[item.code] = {
              type: item.type,
              value: item.value,
              expiresAt: item.expiresAt?.toISOString(),
              maxUses: item.maxUses ?? item.max_uses,
              usedCount: item.usedCount ?? item.used_count,
              minSpendKes: item.minSpendKes ?? item.min_spendKes,
              isActive: item.isActive ?? item.is_active,
            };
          }
          return result;
        }),
        getOrders(),
        getDonors(),
      ]);

      return NextResponse.json({
        config,
        tickerTerms,
        promoCodes,
        orders: (orders || []).map((o: { items: unknown; [key: string]: unknown }) => ({
          ...o,
          items: typeof o.items === "string" ? JSON.parse(o.items) : o.items,
        })),
        donors,
      }, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      });
    } catch (err) {
      console.warn("[Config API] DB read failed, falling back to memory:", err);
    }
  }

  const store = getServerStore();
  return NextResponse.json(
    {
      config: store.config,
      tickerTerms: store.tickerTerms,
      promoCodes: store.promoCodes,
      orders: store.orders,
      donors: store.donors,
    },
    {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    }
  );
}

export async function POST(req: Request) {
  if (!rateLimit(req)) {
    return rateLimitResponse(30, 60_000);
  }

  try {
    const body = await req.json();
    const { action } = body;
    const db = await getDb();

    // Database operations
    if (db && ["updateConfig", "addTickerTerm", "removeTickerTerm", "setTickerTerms", "addPromoCode", "updatePromoCode", "deletePromoCode", "updateOrderStatus", "pinDonorShoutout"].includes(action || "")) {
      try {
        if (action === "updateConfig") {
          // Update each config key
          for (const [key, value] of Object.entries(body.data || {})) {
            await (await import("@/lib/dbService")).updateSiteConfig(key, value);
          }
          // Also update in-memory
          updateConfig(body.data);
          const store = getServerStore();
          return NextResponse.json({ success: true, config: store.config });
        }

        if (action === "addTickerTerm") {
          const updated = addTickerTerm(body.term);
          if (db) await (await import("@/lib/dbService")).addTickerTerm(body.term, updated.length - 1);
          return NextResponse.json({ success: true, tickerTerms: updated });
        }

        if (action === "removeTickerTerm") {
          const updated = removeTickerTerm(body.term);
          if (db) await (await import("@/lib/dbService")).removeTickerTerm(body.term);
          return NextResponse.json({ success: true, tickerTerms: updated });
        }

        if (action === "setTickerTerms") {
          const updated = setTickerTerms(body.terms);
          if (db) await (await import("@/lib/dbService")).reorderTickerTerms(body.terms);
          return NextResponse.json({ success: true, tickerTerms: updated });
        }

        if (action === "addPromoCode") {
          const updated = addPromoCode(body.code, body.rule);
          if (db) await (await import("@/lib/dbService")).addPromoCode(body.code, body.rule);
          return NextResponse.json({ success: true, promoCodes: updated });
        }

        if (action === "updatePromoCode") {
          const updated = updatePromoCode(body.code, body.rule);
          if (db) await (await import("@/lib/dbService")).updatePromoCode(body.code, body.rule);
          return NextResponse.json({ success: true, promoCodes: updated });
        }

        if (action === "deletePromoCode") {
          const updated = deletePromoCode(body.code);
          if (db) await (await import("@/lib/dbService")).deletePromoCode(body.code);
          return NextResponse.json({ success: true, promoCodes: updated });
        }

        if (action === "updateOrderStatus") {
          const updated = updateOrderStatus(body.orderId, body.status);
          if (db) await (await import("@/lib/dbService")).updateOrderStatus(body.orderId, body.status);
          return NextResponse.json({ success: true, orders: updated });
        }

        if (action === "pinDonorShoutout") {
          const updated = pinDonorShoutout(body.donorId, body.pinned);
          if (db) await (await import("@/lib/dbService")).pinDonorShoutout(body.donorId, body.pinned);
          return NextResponse.json({ success: true, donors: updated });
        }
      } catch (err) {
        console.warn("[Config API] DB write failed, falling back to memory:", err);
      }
    }

    // Fallback to in-memory store
    if (action === "updateConfig") {
      const updated = updateConfig(body.data);
      return NextResponse.json({ success: true, config: updated });
    }

    if (action === "addTickerTerm") {
      const updated = addTickerTerm(body.term);
      return NextResponse.json({ success: true, tickerTerms: updated });
    }

    if (action === "removeTickerTerm") {
      const updated = removeTickerTerm(body.term);
      return NextResponse.json({ success: true, tickerTerms: updated });
    }

    if (action === "setTickerTerms") {
      const updated = setTickerTerms(body.terms);
      return NextResponse.json({ success: true, tickerTerms: updated });
    }

    if (action === "addPromoCode") {
      const updated = addPromoCode(body.code, body.rule);
      return NextResponse.json({ success: true, promoCodes: updated });
    }

    if (action === "updatePromoCode") {
      const updated = updatePromoCode(body.code, body.rule);
      return NextResponse.json({ success: true, promoCodes: updated });
    }

    if (action === "deletePromoCode") {
      const updated = deletePromoCode(body.code);
      return NextResponse.json({ success: true, promoCodes: updated });
    }

    if (action === "reorderTickerTerms") {
      const updated = reorderTickerTerms(body.sourceIndex, body.destinationIndex);
      return NextResponse.json({ success: true, tickerTerms: updated });
    }

    if (action === "updateOrderStatus") {
      const updated = updateOrderStatus(body.orderId, body.status);
      return NextResponse.json({ success: true, orders: updated });
    }

    if (action === "pinDonorShoutout") {
      const updated = pinDonorShoutout(body.donorId, body.pinned);
      return NextResponse.json({ success: true, donors: updated });
    }

    if (action === "addDonor") {
      const updated = addDonor(body.donor);
      return NextResponse.json({ success: true, donors: updated });
    }

    if (action === "createOrder") {
      const updated = addOrder(body.order);
      return NextResponse.json({ success: true, orders: updated });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
