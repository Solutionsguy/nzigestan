import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema";

export type AppDatabase = NodePgDatabase<typeof schema>;

// Database module - conditionally import to avoid build issues without PostgreSQL
let _db: AppDatabase | null = null;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn("[DB] DATABASE_URL not set — running in fallback mode");
}

// Lazy load database modules to avoid build-time resolution issues
export async function getDb(): Promise<AppDatabase | null> {
  if (!_db && DATABASE_URL) {
    try {
      const { drizzle } = await import("drizzle-orm/node-postgres");
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: DATABASE_URL });
      _db = drizzle(pool, { schema }) as unknown as AppDatabase;
    } catch (err) {
      console.error("[DB] Failed to initialize database:", err);
    }
  }
  return _db;
}

/**
 * Initialize database tables (run on startup or via migration)
 */
export async function initDatabase() {
  const db = await getDb();
  if (!db) return;

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS broadcast (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        is_live BOOLEAN NOT NULL DEFAULT false,
        stream_title TEXT NOT NULL DEFAULT '',
        viewer_count INTEGER NOT NULL DEFAULT 0,
        next_stream_date TEXT NOT NULL DEFAULT '',
        ingestion_url TEXT NOT NULL DEFAULT '',
        youtube_video_id TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS episodes (
        id TEXT PRIMARY KEY,
        youtube_id TEXT NOT NULL,
        title TEXT NOT NULL,
        thumbnail TEXT NOT NULL,
        duration TEXT NOT NULL,
        view_count INTEGER NOT NULL DEFAULT 0,
        published_at TIMESTAMP NOT NULL,
        frequency TEXT NOT NULL,
        tags TEXT[],
        is_pinned BOOLEAN DEFAULT false,
        is_unlisted BOOLEAN DEFAULT false,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS merch_products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tagline TEXT NOT NULL,
        priceKes INTEGER NOT NULL,
        category TEXT NOT NULL,
        sizes TEXT[],
        stock_total INTEGER NOT NULL DEFAULT 0,
        stock_remaining INTEGER NOT NULL DEFAULT 0,
        image TEXT NOT NULL,
        gallery TEXT[],
        is_archive BOOLEAN DEFAULT false,
        is_preorder BOOLEAN DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT,
        venue TEXT NOT NULL,
        venue_coords JSONB,
        date TIMESTAMP NOT NULL,
        time TEXT NOT NULL,
        capacity_total INTEGER NOT NULL,
        capacity_booked INTEGER NOT NULL DEFAULT 0,
        cover_image TEXT NOT NULL,
        ticket_tiers JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'on-sale',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ticker_terms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        term TEXT NOT NULL UNIQUE,
        order_index INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS promo_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        value JSONB NOT NULL,
        expires_at TIMESTAMP,
        max_uses INTEGER,
        used_count INTEGER NOT NULL DEFAULT 0,
        min_spendKes INTEGER,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        ward TEXT NOT NULL,
        items JSONB NOT NULL,
        totalKes INTEGER NOT NULL,
        shipping_fee INTEGER NOT NULL DEFAULT 0,
        discount_amount INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        mpesa_receipt TEXT,
        mpesa_checkout_request TEXT,
        shipping_method TEXT NOT NULL DEFAULT 'standard',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS donors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        amountKes INTEGER NOT NULL,
        tier TEXT NOT NULL DEFAULT 'Swarm Citizen',
        shoutout_pinned BOOLEAN NOT NULL DEFAULT false,
        mpesa_receipt TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS site_config (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS media (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        original_name TEXT NOT NULL,
        file_name TEXT NOT NULL UNIQUE,
        mime_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        path TEXT NOT NULL,
        url TEXT NOT NULL,
        alt TEXT,
        category TEXT,
        tags TEXT[],
        uploaded_by TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        citizen_id TEXT NOT NULL UNIQUE,
        subscribed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        is_active BOOLEAN NOT NULL DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        citizen_id TEXT NOT NULL UNIQUE,
        event_id TEXT NOT NULL,
        tier_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        qr_token TEXT NOT NULL UNIQUE,
        mpesa_receipt TEXT,
        status TEXT NOT NULL DEFAULT 'issued',
        purchased_at TIMESTAMP NOT NULL DEFAULT NOW(),
        checked_in_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_episodes_frequency ON episodes(frequency);
      CREATE INDEX IF NOT EXISTS idx_episodes_published ON episodes(published_at DESC);
      CREATE INDEX IF NOT EXISTS idx_merch_category ON merch_products(category);
      CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
      CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_donors_amount ON donors(amountKes DESC);
      CREATE INDEX IF NOT EXISTS idx_media_category ON media(category);
    `);
    console.log("[DB] Database initialized successfully");
  } catch (err) {
    console.error("[DB] Failed to initialize database:", err);
    throw err;
  }
}

