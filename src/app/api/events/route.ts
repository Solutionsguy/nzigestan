import { NextResponse } from "next/server";
import { getServerStore, addEvent, updateEvent, deleteEvent } from "@/lib/serverStore";
import type { Event } from "@/types";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function GET() {
  const store = getServerStore();
  return NextResponse.json(store.events, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}

export async function POST(req: Request) {
  if (!rateLimit(req)) {
    return rateLimitResponse(30, 60_000);
  }
  try {
    const body = await req.json();
    const newEvent: Event = {
      id: body.id || `event-${Date.now()}`,
      category: body.category || "swarm-nature-hike",
      title: body.title || "Untitled Gathering",
      subtitle: body.subtitle || "The Republic Physical Odyssey",
      venue: body.venue || "Nairobi, Kenya",
      date: body.date || new Date().toISOString().split("T")[0],
      time: body.time || "08:00 EAT",
      capacityTotal: Number(body.capacityTotal) || 100,
      capacityBooked: Number(body.capacityBooked) || 0,
      coverImage: body.coverImage || "/assets/studio/homepage-hero.png",
      status: body.status || "on-sale",
      ticketTiers: body.ticketTiers || [
        {
          id: "regular",
          name: "Regular Citizen Pass",
          description: "General Admission Pass",
          priceKes: Number(body.priceKes) || 2000,
        },
      ],
    };
    const updated = addEvent(newEvent);
    return NextResponse.json({ success: true, events: updated, event: newEvent });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing event id" }, { status: 400 });
    }
    const updated = updateEvent(body.id, body);
    return NextResponse.json({ success: true, events: updated });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing event id" }, { status: 400 });
    }
    const updated = deleteEvent(id);
    return NextResponse.json({ success: true, events: updated });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
