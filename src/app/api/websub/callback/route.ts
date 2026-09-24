import { NextResponse } from "next/server";
import { updateBroadcast } from "@/lib/serverStore";

/**
 * YouTube PubSubHubbub (WebSub) Verification (GET) & Notification Receiver (POST)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get("hub.challenge");
  const topic = searchParams.get("hub.topic");

  console.log(`[WebSub Verification]: Challenge received for topic: ${topic}`);

  if (challenge) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "No hub.challenge provided" }, { status: 400 });
}

export async function POST(req: Request) {
  try {
    const rawXml = await req.text();
    console.log("[WebSub Notification Received]: New content update from YouTube Channel");

    // Parse broadcast type from XML
    const isLiveBroadcast = rawXml.includes("yt:broadcastType") || rawXml.includes("live");

    if (isLiveBroadcast) {
      // Update broadcast state to LIVE ON AIR
      updateBroadcast({
        isLive: true,
        streamTitle: "Live Broadcast Detected via WebSub",
        updatedAt: new Date().toISOString(),
      });
      console.log("[WebSub] Broadcast state updated to LIVE ON AIR");
    }

    return NextResponse.json({
      success: true,
      broadcastDetected: isLiveBroadcast,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("WebSub Notification Error:", err);
    return NextResponse.json({ error: "Failed to parse notification" }, { status: 500 });
  }
}
