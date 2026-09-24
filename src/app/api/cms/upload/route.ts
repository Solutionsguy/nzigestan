import { NextResponse } from "next/server";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { getDb } from "@/lib/db";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { eq, desc } from "drizzle-orm";
import * as schema from "@/db/schema";

const UPLOAD_DIR = path.join(process.cwd(), "public", "assets", "cms");
const DATA_DIR = path.join(process.cwd(), ".data");
const MEDIA_STORE_FILE = path.join(DATA_DIR, "media_store.json");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Ensure directories exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface LocalMediaItem {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  path: string;
  url: string;
  alt: string;
  category: string | null;
  tags: string[] | null;
  uploadedBy: string | null;
  createdAt: string;
}

function getLocalMedia(): LocalMediaItem[] {
  try {
    if (fs.existsSync(MEDIA_STORE_FILE)) {
      return JSON.parse(fs.readFileSync(MEDIA_STORE_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("[CMS Local Store] Read error:", err);
  }
  return [];
}

function saveLocalMedia(items: LocalMediaItem[]) {
  try {
    fs.writeFileSync(MEDIA_STORE_FILE, JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.error("[CMS Local Store] Write error:", err);
  }
}

/**
 * Media Upload Endpoint
 * Supports PostgreSQL Drizzle DB if configured, otherwise falls back gracefully to local disk + JSON store.
 */
export async function POST(req: Request) {
  if (!rateLimit(req)) {
    return rateLimitResponse(30, 60_000);
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as string | null;
    const alt = formData.get("alt") as string | null;
    const tags = formData.get("tags") as string | null;
    const uploadedBy = formData.get("uploadedBy") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: jpeg, png, webp, gif, mp4" }, { status: 400 });
    }

    // Generate unique filename
    const originalName = file.name;
    const ext = path.extname(originalName);
    const mediaId = crypto.randomUUID();
    const fileName = `${mediaId}${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Save file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const url = `/assets/cms/${fileName}`;
    const tagArray = tags ? tags.split(",").map((t) => t.trim()) : [];

    const db = await getDb();
    if (db) {
      const mediaRecord = await db
        .insert(schema.media)
        .values({
          originalName,
          fileName,
          mimeType: file.type,
          fileSize: file.size,
          path: filePath,
          url,
          alt: alt || "",
          category: category || null,
          tags: tagArray.length > 0 ? tagArray : null,
          uploadedBy: uploadedBy || null,
        })
        .returning();

      return NextResponse.json({
        success: true,
        media: mediaRecord[0],
        url,
      });
    }

    // Fallback: local file store
    const localRecord: LocalMediaItem = {
      id: mediaId,
      originalName,
      fileName,
      mimeType: file.type,
      fileSize: file.size,
      path: filePath,
      url,
      alt: alt || "",
      category: category || null,
      tags: tagArray.length > 0 ? tagArray : null,
      uploadedBy: uploadedBy || null,
      createdAt: new Date().toISOString(),
    };

    const mediaList = getLocalMedia();
    mediaList.unshift(localRecord);
    saveLocalMedia(mediaList);

    return NextResponse.json({
      success: true,
      media: localRecord,
      url,
    });
  } catch (err) {
    console.error("[CMS Upload] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * List uploaded media
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const db = await getDb();
    if (db) {
      const baseQuery = db.select().from(schema.media);
      const filteredQuery = category ? baseQuery.where(eq(schema.media.category, category)) : baseQuery;
      const media = await filteredQuery.orderBy(desc(schema.media.createdAt)).limit(limit);
      return NextResponse.json(media);
    }

    // Fallback: read local store
    let media = getLocalMedia();
    if (category) {
      media = media.filter((m) => m.category === category);
    }
    return NextResponse.json(media.slice(0, limit));
  } catch (err) {
    console.error("[CMS List] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Delete uploaded media
 */
export async function DELETE(req: Request) {
  if (!rateLimit(req)) {
    return rateLimitResponse(30, 60_000);
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 });
    }

    const db = await getDb();
    if (db) {
      const [media] = await db
        .select()
        .from(schema.media)
        .where(eq(schema.media.id, id))
        .limit(1);

      if (!media) {
        return NextResponse.json({ error: "Media not found" }, { status: 404 });
      }

      try {
        fs.unlinkSync(media.path);
      } catch (err) {
        console.warn("[CMS Delete] Failed to delete physical file:", err);
      }

      await db.delete(schema.media).where(eq(schema.media.id, id));
      return NextResponse.json({ success: true });
    }

    // Fallback: local store
    const mediaList = getLocalMedia();
    const media = mediaList.find((m) => m.id === id);

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    try {
      if (fs.existsSync(media.path)) {
        fs.unlinkSync(media.path);
      }
    } catch (err) {
      console.warn("[CMS Delete] Failed to delete file:", err);
    }

    const updated = mediaList.filter((m) => m.id !== id);
    saveLocalMedia(updated);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[CMS Delete] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
