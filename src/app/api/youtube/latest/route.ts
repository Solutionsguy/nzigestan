import { NextResponse } from "next/server";
import { fetchLatestYouTubeEpisodes, getCachedEpisodes } from "@/lib/youtube";
import { setEpisodes } from "@/lib/serverStore";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("refresh") === "true";
    const maxResults = parseInt(searchParams.get("limit") || "15", 10);
    const syncStore = searchParams.get("sync") !== "false";

    const episodes = await fetchLatestYouTubeEpisodes(maxResults, forceRefresh);
    const cacheInfo = getCachedEpisodes();

    // Optionally sync into server store so all other endpoints immediately see fresh data
    if (syncStore && episodes.length > 0) {
      setEpisodes(episodes);
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
