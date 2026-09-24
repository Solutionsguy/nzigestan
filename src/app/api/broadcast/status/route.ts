import { NextResponse } from "next/server";
import { getServerStore, updateBroadcast } from "@/lib/serverStore";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { getBroadcast, updateBroadcast as updateBroadcastDb } from "@/lib/dbService";
import { getDb } from "@/lib/db";

let lastSyncTime = 0;
const SYNC_THROTTLE_MS = 60_000; // Check YouTube at most once per 60s

async function syncYouTubeInBackground() {
  const now = Date.now();
  if (now - lastSyncTime < SYNC_THROTTLE_MS) return;
  lastSyncTime = now;
  try {
    const { getYouTubeLiveInfo } = await import("@/lib/youtube");
    const liveInfo = await getYouTubeLiveInfo();
    const { broadcast } = getServerStore();
    const updates: Partial<typeof broadcast> = {};

    if (liveInfo.isLive) {
      if (!broadcast.isLive) updates.isLive = true;
      if (liveInfo.streamTitle && liveInfo.streamTitle !== broadcast.streamTitle) {
        updates.streamTitle = liveInfo.streamTitle;
      }
      if (liveInfo.youtubeVideoId && liveInfo.youtubeVideoId !== broadcast.youtubeVideoId) {
        updates.youtubeVideoId = liveInfo.youtubeVideoId;
      }
      if (liveInfo.ingestionUrl && liveInfo.ingestionUrl !== broadcast.ingestionUrl) {
        updates.ingestionUrl = liveInfo.ingestionUrl;
      }
      if (liveInfo.viewerCount && liveInfo.viewerCount !== broadcast.viewerCount) {
        updates.viewerCount = liveInfo.viewerCount;
      }
    } else if (!liveInfo.isLive && broadcast.isLive) {
      updates.isLive = false;
      updates.viewerCount = 0;
    }

    if (Object.keys(updates).length > 0) {
      updateBroadcast(updates);
      const db = await getDb();
      if (db) {
        try {
          await updateBroadcastDb(updates);
        } catch (e) {
          console.warn("[Broadcast API] background DB update failed:", e);
        }
      }
    }
  } catch (err) {
    console.warn("[Broadcast API] background live sync failed:", err);
  }
}

export async function GET() {
  // Fire on-demand background YouTube check (non-blocking)
  syncYouTubeInBackground().catch(() => {});

  // Try database first, fallback to in-memory store
  const db = await getDb();
  if (db) {
    try {
      const broadcast = await getBroadcast();
      if (broadcast) {
        return NextResponse.json({
          isLive: broadcast.isLive,
          streamTitle: broadcast.streamTitle,
          viewerCount: broadcast.viewerCount,
          nextStreamDate: broadcast.nextStreamDate,
          ingestionUrl: broadcast.ingestionUrl,
          youtubeVideoId: broadcast.youtubeVideoId,
          updatedAt: broadcast.updatedAt?.toISOString() || new Date().toISOString(),
        }, {
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
      }
    } catch (err) {
      console.warn("[Broadcast API] DB read failed, falling back to memory:", err);
    }
  }

  const store = getServerStore();
  return NextResponse.json(store.broadcast, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}

export async function POST(req: Request) {
  if (!rateLimit(req)) {
    return rateLimitResponse(30, 60_000);
  }

  try {
    const body = await req.json();
    const db = await getDb();

    // Try database first
    if (db) {
      try {
        const updated = await updateBroadcastDb(body);
        if (updated) {
          // Also update in-memory store
          updateBroadcast(body);
          return NextResponse.json({
            isLive: updated.isLive,
            streamTitle: updated.streamTitle,
            viewerCount: updated.viewerCount,
            nextStreamDate: updated.nextStreamDate,
            ingestionUrl: updated.ingestionUrl,
            youtubeVideoId: updated.youtubeVideoId,
            updatedAt: updated.updatedAt?.toISOString() || new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn("[Broadcast API] DB write failed, falling back to memory:", err);
      }
    }

    // Fallback to in-memory store
    const updated = updateBroadcast(body);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid payload", details: String(error) },
      { status: 400 }
    );
  }
}
