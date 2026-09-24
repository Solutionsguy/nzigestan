// Database service module
import type { Episode, MerchProduct, Event, PromoCodeRule } from "@/types";
import { eq, desc, asc, sql } from "drizzle-orm";
import * as schema from "@/db/schema";

import type { AppDatabase } from "@/lib/db";

// Lazy-loaded database client
let _db: AppDatabase | null = null;

async function getDbInstance() {
  if (!_db) {
    const { getDb } = await import("@/lib/db");
    _db = await getDb();
  }
  return _db;
}

// ============================================================
// BROADCAST
// ============================================================

export async function getBroadcast() {
  const db = await getDbInstance();
  if (!db) return null;
  const rows = await db.select().from(schema.broadcast).limit(1);
  return rows[0] ?? null;
}

export async function updateBroadcast(data: {
  isLive?: boolean;
  streamTitle?: string;
  viewerCount?: number;
  nextStreamDate?: string;
  ingestionUrl?: string;
  youtubeVideoId?: string;
}) {
  const db = await getDbInstance();
  if (!db) return null;
  const now = new Date();
  const [row] = await db
    .insert(schema.broadcast)
    .values({
      isLive: data.isLive ?? false,
      streamTitle: data.streamTitle ?? "",
      viewerCount: data.viewerCount ?? 0,
      nextStreamDate: data.nextStreamDate ?? "",
      ingestionUrl: data.ingestionUrl ?? "",
      youtubeVideoId: data.youtubeVideoId ?? "",
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.broadcast.id,
      set: {
        isLive: data.isLive ?? sql`broadcast.is_live`,
        streamTitle: data.streamTitle ?? sql`broadcast.stream_title`,
        viewerCount: data.viewerCount ?? sql`broadcast.viewer_count`,
        nextStreamDate: data.nextStreamDate ?? sql`broadcast.next_stream_date`,
        ingestionUrl: data.ingestionUrl ?? sql`broadcast.ingestion_url`,
        youtubeVideoId: data.youtubeVideoId ?? sql`broadcast.youtube_video_id`,
        updatedAt: now,
      },
    })
    .returning();
  return row;
}

// ============================================================
// EPISODES
// ============================================================

export async function getEpisodes(limit = 20) {
  const db = await getDbInstance();
  if (!db) return [];
  return await db
    .select()
    .from(schema.episodes)
    .orderBy(desc(schema.episodes.publishedAt))
    .limit(limit);
}

export async function addEpisode(episode: Episode) {
  const db = await getDbInstance();
  if (!db) return null;
  const [row] = await db
    .insert(schema.episodes)
    .values({
      ...episode,
      publishedAt: new Date(episode.publishedAt),
      tags: episode.tags,
    })
    .onConflictDoUpdate({
      target: schema.episodes.id,
      set: {
        title: episode.title,
        thumbnail: episode.thumbnail,
        duration: episode.duration,
        viewCount: episode.viewCount,
        publishedAt: new Date(episode.publishedAt),
        frequency: episode.frequency,
        tags: episode.tags,
      },
    })
    .returning();
  return row;
}

export async function updateEpisode(id: string, updates: Partial<Episode>) {
  const db = await getDbInstance();
  if (!db) return null;
  // Prepare update payload, enforcing Date for publishedAt
  type UpdatePayload = Partial<Omit<Episode, "publishedAt">> & {
    publishedAt?: Date;
    updatedAt: Date;
  };
  const updatePayload: UpdatePayload = { ...updates, updatedAt: new Date() } as UpdatePayload;
  if (updatePayload.publishedAt && typeof updatePayload.publishedAt === "string") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updatePayload as any).publishedAt = new Date(updatePayload.publishedAt);
  }
  const [row] = await db
    .update(schema.episodes)
    .set(updatePayload as unknown as Record<string, unknown>)
  .where(eq(schema.episodes.id, id))
  .returning();
  return row;
}

export async function deleteEpisode(id: string) {
  const db = await getDbInstance();
  if (!db) return false;
  const [row] = await db
    .delete(schema.episodes)
    .where(eq(schema.episodes.id, id))
    .returning();
  return !!row;
}

// ============================================================
// MERCH
// ============================================================

export async function getMerch() {
  const db = await getDbInstance();
  if (!db) return [];
  return await db.select().from(schema.merchProducts);
}

export async function addMerchProduct(product: MerchProduct) {
  const db = await getDbInstance();
  if (!db) return null;
  const [row] = await db
    .insert(schema.merchProducts)
    .values(product)
    .onConflictDoUpdate({
      target: schema.merchProducts.id,
      set: {
        name: product.name,
        tagline: product.tagline,
        priceKes: product.priceKes,
        category: product.category,
        sizes: product.sizes,
        stockTotal: product.stockTotal,
        stockRemaining: product.stockRemaining,
        image: product.image,
        gallery: product.gallery,
        isArchive: product.isArchive,
        isPreorder: product.isPreorder,
      },
    })
    .returning();
  return row;
}

export async function updateMerchProduct(id: string, updates: Partial<MerchProduct>) {
  const db = await getDbInstance();
  if (!db) return null;
  const [row] = await db
    .update(schema.merchProducts)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(schema.merchProducts.id, id))
    .returning();
  return row;
}

export async function deleteMerchProduct(id: string) {
  const db = await getDbInstance();
  if (!db) return false;
  const [row] = await db
    .delete(schema.merchProducts)
    .where(eq(schema.merchProducts.id, id))
    .returning();
  return !!row;
}

// ============================================================
// EVENTS
// ============================================================

export async function getEvents() {
  const db = await getDbInstance();
  if (!db) return [];
  return await db
    .select()
    .from(schema.events)
    .orderBy(asc(schema.events.date));
}

export async function addEvent(event: Event) {
  const db = await getDbInstance();
  if (!db) return null;
    const [row] = await db
      .insert(schema.events)
      .values({ ...event, date: new Date(event.date) })
      .onConflictDoUpdate({
        target: schema.events.id,
        set: {
          category: event.category,
          title: event.title,
          subtitle: event.subtitle,
          venue: event.venue,
          venueCoords: event.venueCoords,
          date: new Date(event.date),
          time: event.time,
          capacityTotal: event.capacityTotal,
          capacityBooked: event.capacityBooked,
          coverImage: event.coverImage,
          ticketTiers: event.ticketTiers,
          status: event.status,
        },
      })

    .returning();
  return row;
}

export async function updateEvent(id: string, updates: Partial<Event>) {
  const db = await getDbInstance();
  if (!db) return null;
  // Prepare payload, converting string dates to Date objects if needed
  const payload: Record<string, unknown> = { ...updates, updatedAt: new Date() };
  if (payload.date && typeof payload.date === "string") {
    payload.date = new Date(payload.date);
  }
  const [row] = await db
    .update(schema.events)
    .set(payload)
    .where(eq(schema.events.id, id))
    .returning();
  return row;
}

export async function deleteEvent(id: string) {
  const db = await getDbInstance();
  if (!db) return false;
  const [row] = await db
    .delete(schema.events)
    .where(eq(schema.events.id, id))
    .returning();
  return !!row;
}

// ============================================================
// TICKER TERMS
// ============================================================

export async function getTickerTerms() {
  const db = await getDbInstance();
  if (!db) return [];
  return await db
    .select()
    .from(schema.tickerTerms)
    .orderBy(asc(schema.tickerTerms.orderIndex))
    .where(eq(schema.tickerTerms.isActive, true));
}

export async function addTickerTerm(term: string, index: number) {
  const db = await getDbInstance();
  if (!db) return null;
  const [row] = await db
    .insert(schema.tickerTerms)
    .values({ term, orderIndex: index })
    .onConflictDoNothing()
    .returning();
  return row;
}

export async function removeTickerTerm(term: string) {
  const db = await getDbInstance();
  if (!db) return false;
  const [row] = await db
    .delete(schema.tickerTerms)
    .where(eq(schema.tickerTerms.term, term))
    .returning();
  return !!row;
}

export async function reorderTickerTerms(terms: string[]) {
  const db = await getDbInstance();
  if (!db) return [];
  const updates = terms.map((term, idx) => ({ term, orderIndex: idx }));
  for (const u of updates) {
    await db
      .update(schema.tickerTerms)
      .set({ orderIndex: u.orderIndex })
      .where(eq(schema.tickerTerms.term, u.term));
  }
  return getTickerTerms();
}

// ============================================================
// PROMO CODES
// ============================================================

export async function getPromoCodes() {
  const db = await getDbInstance();
  if (!db) return [];
  return await db.select().from(schema.promoCodes);
}

export async function addPromoCode(code: string, rule: PromoCodeRule) {
  const db = await getDbInstance();
  if (!db) return null;
  // Build payload, converting a string expiresAt to a Date if needed
  const base = { code: code.toUpperCase(), ...rule };
  const payload = {
    ...base,
    expiresAt: typeof base.expiresAt === "string" ? new Date(base.expiresAt) : base.expiresAt,
  };
  const [row] = await db
    .insert(schema.promoCodes)
    .values(payload)
    .onConflictDoUpdate({
      target: schema.promoCodes.code,
      set: { ...rule, expiresAt: typeof rule.expiresAt === "string" ? new Date(rule.expiresAt) : rule.expiresAt },
    })
    .returning();
  return row;
}

export async function updatePromoCode(code: string, updates: Partial<PromoCodeRule>) {
  const db = await getDbInstance();
  if (!db) return null;
  // Build payload for update, handling possible string expiresAt
  const updatePayload = {
    ...updates,
    expiresAt:
      typeof updates.expiresAt === "string"
        ? new Date(updates.expiresAt)
        : updates.expiresAt,
  };
  const [row] = await db
    .update(schema.promoCodes)
    .set(updatePayload)
    .where(eq(schema.promoCodes.code, code.toUpperCase()))
    .returning();
  return row;
}

export async function deletePromoCode(code: string) {
  const db = await getDbInstance();
  if (!db) return false;
  const [row] = await db
    .delete(schema.promoCodes)
    .where(eq(schema.promoCodes.code, code.toUpperCase()))
    .returning();
  return !!row;
}

// ============================================================
// ORDERS
// ============================================================

export async function getOrders(status?: string) {
  const db = await getDbInstance();
  if (!db) return [];
  const base = db.select().from(schema.orders);
  const query = status ? base.where(eq(schema.orders.status, status)) : base;
  return await query.orderBy(desc(schema.orders.createdAt));
}

export async function addOrder(order: {
  id: string;
  customerName: string;
  phone: string;
  ward: string;
  items: unknown[];
  totalKes: number;
  shippingFee: number;
  discountAmount: number;
  status: "pending" | "paid" | "dispatched" | "delivered";
  mpesaReceipt?: string;
  shippingMethod: string;
}) {
  const db = await getDbInstance();
  if (!db) return null;
  const [row] = await db.insert(schema.orders).values(order).returning();
  return row;
}

export async function updateOrderStatus(
  orderId: string,
  status: "pending" | "paid" | "dispatched" | "delivered"
) {
  const db = await getDbInstance();
  if (!db) return null;
  const [row] = await db
    .update(schema.orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.orders.id, orderId))
    .returning();
  return row;
}

// ============================================================
// DONORS
// ============================================================

export async function getDonors(limit = 50) {
  const db = await getDbInstance();
  if (!db) return [];
  return await db
    .select()
    .from(schema.donors)
    .orderBy(desc(schema.donors.amountKes))
    .limit(limit);
}

export async function addDonor(donor: {
  name: string;
  amountKes: number;
  tier: string;
  mpesaReceipt?: string;
}) {
  const db = await getDbInstance();
  if (!db) return null;
  const [row] = await db.insert(schema.donors).values(donor).returning();
  return row;
}

export async function pinDonorShoutout(donorId: string, pinned: boolean) {
  const db = await getDbInstance();
  if (!db) return null;
  const [row] = await db
    .update(schema.donors)
    .set({ shoutoutPinned: pinned })
    .where(eq(schema.donors.id, donorId))
    .returning();
  return row;
}

// ============================================================
// SITE CONFIG
// ============================================================

export async function getSiteConfig() {
  const db = await getDbInstance();
  if (!db) return {};
  const rows = await db.select().from(schema.siteConfig);
  const config: Record<string, unknown> = {};
  for (const row of rows) {
    config[row.key] = row.value;
  }
  return config;
}

export async function updateSiteConfig(key: string, value: unknown) {
  const db = await getDbInstance();
  if (!db) return null;
  const [row] = await db
    .insert(schema.siteConfig)
    .values({ key, value })
    .onConflictDoUpdate({
      target: schema.siteConfig.key,
      set: { value, updatedAt: new Date() },
    })
    .returning();
  return row;
}

// ============================================================
// NEWSLETTER
// ============================================================

export async function subscribeToNewsletter(email: string) {
  const db = await getDbInstance();
  if (!db) return null;
  const citizenId = `NZG-${Math.floor(100 + Math.random() * 900)}-NRB`;
  const [row] = await db
    .insert(schema.newsletterSubscribers)
    .values({ email, citizenId })
    .onConflictDoNothing()
    .returning();
  return row;
}

export async function getNewsletterSubscribers() {
  const db = await getDbInstance();
  if (!db) return [];
  return await db
    .select()
    .from(schema.newsletterSubscribers)
    .orderBy(desc(schema.newsletterSubscribers.subscribedAt));
}

// ============================================================
// TICKETS
// ============================================================

export async function addTicket(ticket: {
  citizenId: string;
  eventId: string;
  tierId: string;
  customerName: string;
  phone: string;
  qrToken: string;
  mpesaReceipt?: string;
}) {
  const db = await getDbInstance();
  if (!db) return null;
  const [row] = await db.insert(schema.tickets).values(ticket).returning();
  return row;
}

export async function verifyTicket(qrToken: string) {
  const db = await getDbInstance();
  if (!db) return null;
  const rows = await db
    .select()
    .from(schema.tickets)
    .where(eq(schema.tickets.qrToken, qrToken))
    .limit(1);
  return rows[0] ?? null;
}

export async function checkInTicket(ticketId: string) {
  const db = await getDbInstance();
  if (!db) return null;
  const [row] = await db
    .update(schema.tickets)
    .set({ status: "checked-in", checkedInAt: new Date() })
    .where(eq(schema.tickets.id, ticketId))
    .returning();
  return row ?? null;
}
