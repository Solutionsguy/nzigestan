import { NextResponse } from "next/server";
import { getYouTubeLiveInfo } from "@/lib/youtube";
import { updateBroadcast, getServerStore } from "@/lib/serverStore";
import { updateBroadcast as updateBroadcastDb } from "@/lib/dbService";
import { getDb } from "@/lib/db";

/**
 * GET /api/broadcast/sync
 * This endpoint is invoked by a scheduler (Vercel cron or GitHub Action)
 * to keep the server store and database in sync with the actual YouTube live state.
 */
export async function GET() {
  try {
    const liveInfo = await getYouTubeLiveInfo();
    const { broadcast } = getServerStore();
    const updates: Partial<typeof broadcast> = {};

    if (liveInfo.isLive) {
      if (!broadcast.isLive) {
        updates.isLive = true;
      }
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
      await updateBroadcast(updates);
      const db = await getDb();
      if (db) {
        try {
          await updateBroadcastDb(updates);
        } catch (e) {
          console.warn("[BroadcastSync API] DB update failed:", e);
        }
      }
    }

    return NextResponse.json({ ok: true, ...liveInfo, updated: Object.keys(updates).length > 0 });
  } catch (err) {
    console.warn("[BroadcastSync] failed:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
