import { NextResponse } from "next/server";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");
const SUBSCRIBERS_FILE = path.join(DATA_DIR, "subscribers.json");

function getSubscribers(): string[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      return JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("[Subscribers] Read error:", e);
  }
  return [];
}

function saveSubscribers(list: string[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (e) {
    console.error("[Subscribers] Write error:", e);
  }
}

export async function POST(req: Request) {
  if (!rateLimit(req)) {
    return rateLimitResponse(20, 60_000);
  }

  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const subs = getSubscribers();

    if (!subs.includes(cleanEmail)) {
      subs.push(cleanEmail);
      saveSubscribers(subs);
    }

    return NextResponse.json({
      success: true,
      message: "Subscribed to the Nzigestan Hive dispatches",
      email: cleanEmail,
    });
  } catch (err) {
    console.error("[Newsletter API] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
