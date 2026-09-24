import { NextResponse } from "next/server";
import { fetchLatestYouTubeEpisodes, getCachedEpisodes } from "@/lib/youtube";
import { setEpisodes } from "@/lib/serverStore";
import { addEpisode as addEpisodeDb } from "@/lib/dbService";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("refresh") === "true";
    const maxResults = parseInt(searchParams.get("limit") || "15", 10);
    const syncStore = searchParams.get("sync") !== "false";

    const episodes = await fetchLatestYouTubeEpisodes(maxResults, forceRefresh);
    const cacheInfo = getCachedEpisodes();

    // Sync into server store and database so all endpoints and pages immediately see fresh data
    if (syncStore && episodes.length > 0) {
      setEpisodes(episodes);
      const db = await getDb();
      if (db) {
        try {
          await Promise.all(episodes.map((ep) => addEpisodeDb(ep)));
        } catch (dbErr) {
          console.warn("[YouTube Ingestion] DB upsert failed:", dbErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      channel: "@thekisianganipodcast",
      source: cacheInfo?.source || "live",
      lastUpdated: cacheInfo?.lastUpdated || new Date().toISOString(),
      cached: !forceRefresh && !!cacheInfo,
      count: episodes.length,
      episodes,
    });
  } catch (err) {
    console.error("API YouTube Latest Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch episodes from YouTube pipeline." },
      { status: 500 }
    );
  }
}
