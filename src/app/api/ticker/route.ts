import { NextResponse } from "next/server";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { getTickerTerms, addTickerTerm, removeTickerTerm, reorderTickerTerms } from "@/lib/dbService";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const terms = await getTickerTerms();
    return NextResponse.json((terms || []).map((t: { term: string }) => t.term));
  } catch (err) {
    console.error("[Ticker API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch ticker terms" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!rateLimit(req)) {
    return rateLimitResponse(30, 60_000);
  }

  try {
    const db = await getDb();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await req.json();
    const { action, term, sourceIndex, destinationIndex } = body;

    if (action === "add") {
      if (!term || typeof term !== "string") {
        return NextResponse.json({ error: "Term is required" }, { status: 400 });
      }
      const formatted = term.startsWith("#") ? term : `#${term}`;
      const terms = await getTickerTerms();
      const newIndex = terms ? terms.length : 0;
      await addTickerTerm(formatted, newIndex);
      const updated = await getTickerTerms();
      return NextResponse.json({ success: true, tickerTerms: (updated || []).map((t: { term: string }) => t.term) });
    }

    if (action === "remove") {
      if (!term) {
        return NextResponse.json({ error: "Term is required" }, { status: 400 });
      }
      await removeTickerTerm(term);
      const updated = await getTickerTerms();
      return NextResponse.json({ success: true, tickerTerms: (updated || []).map((t: { term: string }) => t.term) });
    }

    if (action === "reorder") {
      if (!Array.isArray(sourceIndex) || !Array.isArray(destinationIndex)) {
        return NextResponse.json({ error: "Invalid reorder payload" }, { status: 400 });
      }
      await reorderTickerTerms([...sourceIndex, ...destinationIndex]);
      const updated = await getTickerTerms();
      return NextResponse.json({ success: true, tickerTerms: (updated || []).map((t: { term: string }) => t.term) });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[Ticker API] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
