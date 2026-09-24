import { NextResponse } from "next/server";
import { getEpisodes, addEpisode as addEpisodeDb, updateEpisode as updateEpisodeDb, deleteEpisode as deleteEpisodeDb } from "@/lib/dbService";
import { getServerStore, setEpisodes, addEpisode, updateEpisode, deleteEpisode } from "@/lib/serverStore";
import type { Episode } from "@/types";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();

  // Try database first
  if (db) {
    try {
      const episodes = await getEpisodes();
      if (episodes.length > 0) {
        // Sync to in-memory store with proper type conversion
        const episodesForStore = episodes.map((e) => ({
          ...e,
          publishedAt:
            e.publishedAt instanceof Date
              ? e.publishedAt.toISOString().split("T")[0]
              : (e.publishedAt as unknown as string),
        }));
        setEpisodes(episodesForStore as Episode[]);
        return NextResponse.json(episodes, {
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
      }
    } catch (err) {
      console.warn("[Episodes API] DB read failed, falling back to memory:", err);
    }
  }

  const store = getServerStore();
  return NextResponse.json(store.episodes, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}

export async function POST(req: Request) {
  if (!rateLimit(req)) {
    return rateLimitResponse(30, 60_000);
  }

  try {
    const body = await req.json();
    const newEpisode: Episode = {
      id: body.id || `ep-${Date.now()}`,
      youtubeId: body.youtubeId || "dQw4w9WgXcQ",
      title: body.title || "Untitled Episode",
      thumbnail: body.thumbnail || "/assets/studio/homepage-hero.png",
      duration: body.duration || "1:30:00",
      viewCount: Number(body.viewCount) || 1200,
      publishedAt: body.publishedAt || new Date().toISOString().split("T")[0],
      frequency: body.frequency || "blissful-banter",
      tags: Array.isArray(body.tags) ? body.tags : ["#TukoKwaBarabara"],
    };

    const db = await getDb();

    // Try database first
    if (db) {
      try {
        const result = await addEpisodeDb(newEpisode);
        if (result) {
          // Also update in-memory store
          addEpisode(newEpisode);
          return NextResponse.json({ success: true, episode: newEpisode });
        }
      } catch (err) {
        console.warn("[Episodes API] DB write failed, falling back to memory:", err);
      }
    }

    // Fallback to in-memory store
    const updated = addEpisode(newEpisode);
    return NextResponse.json({ success: true, episodes: updated, episode: newEpisode });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  if (!rateLimit(req)) {
    return rateLimitResponse(30, 60_000);
  }

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing episode id" }, { status: 400 });
    }

    const db = await getDb();

    // Try database first
    if (db) {
      try {
        const updated = await updateEpisodeDb(body.id, body);
        if (updated) {
          // Also update in-memory store
          updateEpisode(body.id, body);
          return NextResponse.json({ success: true });
        }
      } catch (err) {
        console.warn("[Episodes API] DB update failed, falling back to memory:", err);
      }
    }

    // Fallback to in-memory store
    const updated = updateEpisode(body.id, body);
    return NextResponse.json({ success: true, episodes: updated });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  if (!rateLimit(req)) {
    return rateLimitResponse(30, 60_000);
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing episode id" }, { status: 400 });
    }

    const db = await getDb();

    // Try database first
    if (db) {
      try {
        const deleted = await deleteEpisodeDb(id);
        if (deleted) {
          // Also update in-memory store
          deleteEpisode(id);
          return NextResponse.json({ success: true });
        }
      } catch (err) {
        console.warn("[Episodes API] DB delete failed, falling back to memory:", err);
      }
    }

    // Fallback to in-memory store
    const updated = deleteEpisode(id);
    return NextResponse.json({ success: true, episodes: updated });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
