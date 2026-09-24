// ============================================================
// YouTube Ingestion Pipeline: API v3 + Public RSS Fallback + Caching
// The Republic of Nzigestan (@thekisianganipodcast)
// ============================================================
import fs from "fs";
import path from "path";
import type { Episode, EpisodeFrequency } from "@/types";

export const API_KEY = process.env.YOUTUBE_API_KEY;
export const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

// Cache Configuration
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 Minutes TTL
const CACHE_DIR = path.join(process.cwd(), ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "youtube_episodes.json");

export interface YouTubeCacheData {
  lastUpdated: string;
  timestamp: number;
  channelId?: string;
  source: "api" | "rss" | "seed" | "cache";
  episodes: Episode[];
}

// In-memory cache fallback
let memoryCache: YouTubeCacheData | null = null;

// Fallback seed episodes when completely offline or during initial startup
export const FALLBACK_SEED_EPISODES: Episode[] = [
  {
    id: "7tkGUXetubY",
    youtubeId: "7tkGUXetubY",
    title: "AMAN on a Mission - Kitengela Only",
    thumbnail: "https://i.ytimg.com/vi/7tkGUXetubY/maxresdefault.jpg",
    duration: "2:35:14",
    viewCount: 28400,
    publishedAt: "2026-09-21T15:12:28Z",
    frequency: "blissful-banter",
    tags: ["#TukoKwaBarabara", "#KitengelaOnly", "#ItawesaSana"],
  },
  {
    id: "-dsFDS1jJtM",
    youtubeId: "-dsFDS1jJtM",
    title: "The Kisiangani Podcast ft. Chinese & Bash — Live in Nairobi",
    thumbnail: "https://i.ytimg.com/vi/-dsFDS1jJtM/maxresdefault.jpg",
    duration: "3:02:18",
    viewCount: 45200,
    publishedAt: "2026-09-20T16:40:27Z",
    frequency: "comic-diaries",
    tags: ["#KuingiaMtaro", "#LafLyfLive"],
  },
  {
    id: "H89igvdTVmw",
    youtubeId: "H89igvdTVmw",
    title: "Ty & The Boyz In Kitengela",
    thumbnail: "https://i.ytimg.com/vi/H89igvdTVmw/maxresdefault.jpg",
    duration: "2:14:38",
    viewCount: 39800,
    publishedAt: "2026-09-20T11:01:02Z",
    frequency: "blissful-banter",
    tags: ["#YouGuy", "#TukoKwaBarabara"],
  },
  {
    id: "P8KIV-Y5zWk",
    youtubeId: "P8KIV-Y5zWk",
    title: "Unplugged With Jacob Aliet",
    thumbnail: "https://i.ytimg.com/vi/P8KIV-Y5zWk/maxresdefault.jpg",
    duration: "2:44:50",
    viewCount: 52100,
    publishedAt: "2026-09-18T13:42:59Z",
    frequency: "deep-dives",
    tags: ["#DeepDives", "#Philosophy"],
  },
  {
    id: "kmH60yhIG80",
    youtubeId: "kmH60yhIG80",
    title: "The Male Status Trap in Modern Dating with IQ Watson",
    thumbnail: "https://i.ytimg.com/vi/kmH60yhIG80/maxresdefault.jpg",
    duration: "2:51:12",
    viewCount: 68400,
    publishedAt: "2026-09-18T02:02:51Z",
    frequency: "deep-dives",
    tags: ["#DeepDives", "#DatingInNairobi"],
  },
  {
    id: "e8qz7obmEZc",
    youtubeId: "e8qz7obmEZc",
    title: "Ladies and Gentlemen ...Its Tonio Kibz From The Sandwich Podcast",
    thumbnail: "https://i.ytimg.com/vi/e8qz7obmEZc/maxresdefault.jpg",
    duration: "2:18:04",
    viewCount: 84300,
    publishedAt: "2026-09-16T17:45:16Z",
    frequency: "comic-diaries",
    tags: ["#TheSandwichPodcast", "#LafLyfLive"],
  },
];

/**
 * Reads cached YouTube data from disk or memory if valid
 */
export function getCachedEpisodes(): YouTubeCacheData | null {
  if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL_MS) {
    return memoryCache;
  }

  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, "utf-8");
      const parsed: YouTubeCacheData = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.episodes) && parsed.episodes.length > 0) {
        memoryCache = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[YouTube Cache] Error reading cache file:", err);
  }

  return memoryCache;
}

/**
 * Saves episodes to both file cache and in-memory cache
 */
export function saveEpisodesToCache(episodes: Episode[], source: "api" | "rss" | "seed"): YouTubeCacheData {
  const cacheData: YouTubeCacheData = {
    lastUpdated: new Date().toISOString(),
    timestamp: Date.now(),
    channelId: CHANNEL_ID,
    source,
    episodes,
  };

  memoryCache = cacheData;

  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2), "utf-8");
    console.log(`[YouTube Cache] Saved ${episodes.length} episodes to disk cache (${CACHE_FILE})`);
  } catch (err) {
    console.warn("[YouTube Cache] Failed to write cache to disk, memory cache active:", err);
  }

  return cacheData;
}

/**
 * Algorithmic categorizer to map podcast episode titles into platform frequencies
 */
export function categorizeEpisode(title: string, description: string = ""): EpisodeFrequency {
  const content = `${title} ${description}`.toLowerCase();

  if (content.includes("12-hour") || content.includes("marathon") || content.includes("special") || content.includes("archive")) {
    return "republic-archives";
  }
  if (
    content.includes("deep dive") ||
    content.includes("philosophy") ||
    content.includes("unplugged") ||
    content.includes("jacob aliet") ||
    content.includes("trap") ||
    content.includes("psychology") ||
    content.includes("existential")
  ) {
    return "deep-dives";
  }
  if (
    content.includes("standup") ||
    content.includes("backstage") ||
    content.includes("comic") ||
    content.includes("laf lyf") ||
    content.includes("chaos") ||
    content.includes("chinese") ||
    content.includes("sandwich") ||
    content.includes("tonio")
  ) {
    return "comic-diaries";
  }
  return "blissful-banter";
}

/**
 * PRIMARY INGESTION: YouTube Data API v3
 */
async function fetchFromYouTubeDataApi(apiKey: string, maxResults: number): Promise<Episode[]> {
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=${maxResults}&type=video`;
  
  const searchRes = await fetch(searchUrl, { cache: "no-store" });
  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`YouTube API search failed (${searchRes.status}): ${errText}`);
  }

  const searchData = await searchRes.json();
  if (!searchData.items || !Array.isArray(searchData.items) || searchData.error) {
    throw new Error(searchData.error?.message || "Invalid YouTube search response structure");
  }

  const videoIds = searchData.items
    .map((item: { id?: { videoId?: string } }) => item.id?.videoId)
    .filter(Boolean)
    .join(",");

  if (!videoIds) return [];

  const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds}&part=snippet,contentDetails,statistics`;
  const detailsRes = await fetch(detailsUrl, { cache: "no-store" });
  if (!detailsRes.ok) {
    const errText = await detailsRes.text();
    throw new Error(`YouTube API details failed (${detailsRes.status}): ${errText}`);
  }

  const detailsData = await detailsRes.json();
  interface YouTubeApiItem {
    id: string;
    snippet: {
      title?: string;
      description?: string;
      publishedAt?: string;
      tags?: string[];
      thumbnails?: {
        maxres?: { url?: string };
        standard?: { url?: string };
        high?: { url?: string };
      };
    };
    contentDetails?: {
      duration?: string;
    };
    statistics?: {
      viewCount?: string;
    };
  }

  return (detailsData.items as YouTubeApiItem[]).map((item: YouTubeApiItem) => {
    const title = decodeXmlEntities(item.snippet.title || "Untitled Episode");
    const desc = item.snippet.description || "";
    const highThumb =
      item.snippet.thumbnails?.maxres?.url ||
      item.snippet.thumbnails?.standard?.url ||
      item.snippet.thumbnails?.high?.url ||
      `https://i.ytimg.com/vi/${item.id}/maxresdefault.jpg`;

    return {
      id: item.id,
      youtubeId: item.id,
      title: title,
      thumbnail: highThumb,
      duration: formatISO8601Duration(item.contentDetails?.duration || "PT1H30M"),
      viewCount: parseInt(item.statistics?.viewCount || "25000", 10),
      publishedAt: item.snippet.publishedAt || new Date().toISOString(),
      frequency: categorizeEpisode(title, desc),
      tags: item.snippet.tags && item.snippet.tags.length > 0 
        ? item.snippet.tags.slice(0, 4).map((t: string) => (t.startsWith("#") ? t : `#${t.replace(/\s+/g, "")}`))
        : ["#TukoKwaBarabara", "#ItawesaSana"],
    };
  });
}

/**
 * FALLBACK INGESTION: Public YouTube XML RSS Feed
 * URL: https://www.youtube.com/feeds/videos.xml?channel_id=...
 * Requires NO API key, NO quotas, completely public.
 */
async function fetchFromYouTubeRssFeed(maxResults: number = 15): Promise<Episode[]> {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
  console.log(`[YouTube Ingestion] Fetching public RSS fallback: ${rssUrl}`);

  const res = await fetch(rssUrl, {
    cache: "no-store",
    headers: { "User-Agent": "Mozilla/5.0 (compatible; NzigestanBot/2.0)" },
  });

  if (!res.ok) {
    throw new Error(`RSS fetch failed with status ${res.status}`);
  }

  const xmlText = await res.text();
  const entries: Episode[] = [];

  const entryMatches = xmlText.match(/<entry>[\s\S]*?<\/entry>/g);
  if (!entryMatches || entryMatches.length === 0) {
    throw new Error("No entries found in YouTube RSS XML");
  }

  for (const entryXml of entryMatches) {
    const videoIdMatch = entryXml.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const titleMatch = entryXml.match(/<title>(.*?)<\/title>/);
    const publishedMatch = entryXml.match(/<published>(.*?)<\/published>/);
    const viewsMatch = entryXml.match(/<media:statistics views="(\d+)"/);
    const descMatch = entryXml.match(/<media:description>([\s\S]*?)<\/media:description>/);

    if (videoIdMatch && titleMatch) {
      const videoId = videoIdMatch[1].trim();
      const title = decodeXmlEntities(titleMatch[1].trim());
      const published = publishedMatch ? publishedMatch[1].trim() : new Date().toISOString();
      const views = viewsMatch ? parseInt(viewsMatch[1], 10) : 32000;
      const desc = descMatch ? descMatch[1].trim() : "";

      entries.push({
        id: videoId,
        youtubeId: videoId,
        title: title,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        duration: "2:20:00",
        viewCount: views,
        publishedAt: published,
        frequency: categorizeEpisode(title, desc),
        tags: ["#TukoKwaBarabara", "#ItawesaSana", "#TheKisianganiPodcast"],
      });
    }
  }

  return entries.slice(0, maxResults);
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * MASTER INGESTION ROUTER:
 * 1. Returns cached episodes if within TTL (unless forceRefresh is true)
 * 2. Attempts YouTube Data API v3 (using provided API key)
 * 3. Falls back to YouTube Public XML RSS Feed
 * 4. Falls back to Seed Episodes
 * 5. Updates and persists cache on disk/memory
 */
export async function fetchLatestYouTubeEpisodes(
  maxResults: number = 15,
  forceRefresh: boolean = false
): Promise<Episode[]> {
  // Check Cache if not forced
  if (!forceRefresh) {
    const cached = getCachedEpisodes();
    if (cached && cached.episodes.length > 0) {
      const ageMinutes = Math.round((Date.now() - cached.timestamp) / 60000);
      console.log(`[YouTube Ingestion] Serving ${cached.episodes.length} episodes from cache (Age: ${ageMinutes}m, Source: ${cached.source})`);
      return cached.episodes.slice(0, maxResults);
    }
  }

  console.log(`[YouTube Ingestion] Fetching live data for channel ${CHANNEL_ID} (forceRefresh=${forceRefresh})...`);

  // Step 1: Try YouTube Data API v3 (requires YOUTUBE_API_KEY env var)
  if (API_KEY) {
    try {
      console.log("[YouTube Ingestion] Attempting YouTube Data API v3 fetch...");
      const episodes = await fetchFromYouTubeDataApi(API_KEY, maxResults);
      if (episodes && episodes.length > 0) {
        console.log(`[YouTube Ingestion] Successfully fetched ${episodes.length} episodes via API v3.`);
        saveEpisodesToCache(episodes, "api");
        return episodes;
      }
    } catch (err) {
      console.warn("[YouTube Ingestion] API v3 failed or quota exhausted. Falling back to RSS...", err);
    }
  } else {
    console.warn("[YouTube Ingestion] YOUTUBE_API_KEY not configured. Skipping API v3, using RSS fallback.");
  }

  // Step 2: Try Public RSS Feed Fallback
  try {
    const rssEpisodes = await fetchFromYouTubeRssFeed(maxResults);
    if (rssEpisodes && rssEpisodes.length > 0) {
      console.log(`[YouTube Ingestion] Successfully fetched ${rssEpisodes.length} episodes via Public RSS Feed.`);
      saveEpisodesToCache(rssEpisodes, "rss");
      return rssEpisodes;
    }
  } catch (rssErr) {
    console.warn("[YouTube Ingestion] Public RSS Feed failed. Falling back to seed archive.", rssErr);
  }

  // Step 3: Check if stale cache exists before using static seed
  const existingCache = getCachedEpisodes();
  if (existingCache && existingCache.episodes.length > 0) {
    console.log("[YouTube Ingestion] Using existing stale cache as emergency fallback.");
    return existingCache.episodes.slice(0, maxResults);
  }

  // Step 4: Seed Fallback
  console.log("[YouTube Ingestion] Using seed fallback episodes.");
  saveEpisodesToCache(FALLBACK_SEED_EPISODES, "seed");
  return FALLBACK_SEED_EPISODES.slice(0, maxResults);
}

/**
 * Converts ISO 8601 duration (e.g. PT2H14M38S) to standard readable format (2:14:38)
 */
function formatISO8601Duration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "1:45:00";
  const hours = match[1] ? match[1] : "0";
  const minutes = match[2] ? match[2].padStart(2, "0") : "00";
  const seconds = match[3] ? match[3].padStart(2, "0") : "00";

  if (hours !== "0") {
    return `${hours}:${minutes}:${seconds}`;
  }
  return `${minutes}:${seconds}`;
}
// ---------------------------------------------------------------------------
/**
 * Fetch live broadcast info for the configured YouTube channel.
 * Returns a simple object used by the broadcast sync module.
 */
export async function getYouTubeLiveInfo(currentKnownVideoId?: string): Promise<{
  isLive: boolean;
  streamTitle?: string;
  ingestionUrl: string;
  youtubeVideoId?: string;
  viewerCount: number;
}> {
  if (!API_KEY || !CHANNEL_ID) {
    console.warn("[YouTube] Missing API_KEY or CHANNEL_ID – live info disabled");
    return { isLive: false, ingestionUrl: "", viewerCount: 0 };
  }

  // 1. If we already know a live video ID, check it directly first (only 1 quota unit, faster & 100% reliable)
  if (currentKnownVideoId) {
    try {
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${currentKnownVideoId}&part=snippet,statistics,liveStreamingDetails`;
      const detailsRes = await fetch(detailsUrl, { cache: "no-store" });
      if (detailsRes.ok) {
        const details = await detailsRes.json();
        const item = details.items && details.items[0];
        if (item) {
          const isStillLive =
            item.snippet?.liveBroadcastContent === "live" ||
            (item.liveStreamingDetails?.actualStartTime && !item.liveStreamingDetails?.actualEndTime);

          if (isStillLive) {
            const streamTitle = decodeXmlEntities(item.snippet?.title || "Live Studio Broadcast");
            const concurrentViewers = item.liveStreamingDetails?.concurrentViewers;
            const viewerCount = concurrentViewers ? parseInt(concurrentViewers, 10) : 0;

            return {
              isLive: true,
              streamTitle,
              youtubeVideoId: currentKnownVideoId,
              ingestionUrl: `https://www.youtube.com/watch?v=${currentKnownVideoId}`,
              viewerCount,
            };
          }
        }
      }
    } catch (err) {
      console.warn("[YouTube] Direct video status check failed:", err);
    }
  }

  // 2. Search for any active live broadcast on the channel
  try {
    const liveSearchUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=id,snippet&eventType=live&type=video&maxResults=1`;
    const searchRes = await fetch(liveSearchUrl, { cache: "no-store" });
    if (!searchRes.ok) {
      console.warn("[YouTube] Live search failed", await searchRes.text());
      return { isLive: false, ingestionUrl: "", viewerCount: 0 };
    }
    const searchData = await searchRes.json();
    const liveItem = searchData.items && searchData.items[0];
    if (!liveItem) {
      return { isLive: false, ingestionUrl: "", viewerCount: 0 };
    }
    const videoId = liveItem.id?.videoId;
    if (!videoId) {
      return { isLive: false, ingestionUrl: "", viewerCount: 0 };
    }

    const streamTitle = decodeXmlEntities(liveItem.snippet?.title || "Live Studio Broadcast");

    // Fetch statistics and live streaming details
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${videoId}&part=snippet,statistics,liveStreamingDetails`;
    const detailsRes = await fetch(detailsUrl, { cache: "no-store" });
    let viewerCount = 0;
    if (detailsRes.ok) {
      const details = await detailsRes.json();
      const item = details.items && details.items[0];
      const concurrentViewers = item?.liveStreamingDetails?.concurrentViewers;
      viewerCount = concurrentViewers ? parseInt(concurrentViewers, 10) : 0;
    }

    return {
      isLive: true,
      streamTitle,
      youtubeVideoId: videoId,
      ingestionUrl: `https://www.youtube.com/watch?v=${videoId}`,
      viewerCount,
    };
  } catch (err) {
    console.warn("[YouTube] Live search error:", err);
    return { isLive: false, ingestionUrl: "", viewerCount: 0 };
  }
}
