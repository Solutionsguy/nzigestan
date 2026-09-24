import { updateBroadcast } from "./serverStore";
import { getYouTubeLiveInfo } from "./youtube";

/**
 * Periodically sync the broadcast state with the actual YouTube live broadcast.
 * Runs every 30 seconds. Adjust the interval as needed.
 */
async function syncBroadcast() {
  try {
    const liveInfo = await getYouTubeLiveInfo();
    const { broadcast } = await import("./serverStore").then(m => m.getServerStore());
    
      if (liveInfo.isLive) {
        const updates: Partial<typeof broadcast> = {};
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

        if (Object.keys(updates).length > 0) {
          await updateBroadcast(updates);
          try {
            const { getDb } = await import("./db");
            const db = await getDb();
            if (db) {
              const { updateBroadcast: updateBroadcastDb } = await import("./dbService");
              await updateBroadcastDb(updates);
            }
          } catch (e) {
            console.warn("[BroadcastSync] DB sync error:", e);
          }
        }
      } else if (!liveInfo.isLive && broadcast.isLive) {
        // Stream has concluded on YouTube
        const updates: Partial<typeof broadcast> = { isLive: false, viewerCount: 0 };
        await updateBroadcast(updates);
        try {
          const { getDb } = await import("./db");
          const db = await getDb();
          if (db) {
            const { updateBroadcast: updateBroadcastDb } = await import("./dbService");
            await updateBroadcastDb(updates);
          }
        } catch (e) {
          console.warn("[BroadcastSync] DB sync error:", e);
        }
      }
  } catch (err) {
    console.warn("[BroadcastSync] failed to sync broadcast:", err);
  }
}

// Start the interval when this module is imported (every 30s)
const INTERVAL_MS = 30_000;
setInterval(() => {
  syncBroadcast();
}, INTERVAL_MS);

// Also run once immediately on startup
syncBroadcast();
