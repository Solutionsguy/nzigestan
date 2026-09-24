import { pgTable, text, boolean, timestamp, jsonb, integer, uuid } from "drizzle-orm/pg-core";

// Broadcast state — single row config table
export const broadcast = pgTable("broadcast", {
  id: uuid("id").primaryKey().defaultRandom(),
  isLive: boolean("is_live").notNull().default(false),
  streamTitle: text("stream_title").notNull().default(""),
  viewerCount: integer("viewer_count").notNull().default(0),
  nextStreamDate: text("next_stream_date").notNull().default(""),
  ingestionUrl: text("ingestion_url").notNull().default(""),
  youtubeVideoId: text("youtube_video_id").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Episodes — synced from YouTube
export const episodes = pgTable("episodes", {
  id: text("id").primaryKey(),
  youtubeId: text("youtube_id").notNull(),
  title: text("title").notNull(),
  thumbnail: text("thumbnail").notNull(),
  duration: text("duration").notNull(),
  viewCount: integer("view_count").notNull().default(0),
  publishedAt: timestamp("published_at").notNull(),
  frequency: text("frequency").notNull(), // blissful-banter, comic-diaries, deep-dives, republic-archives
  tags: text("tags").array().notNull(),
  isPinned: boolean("is_pinned").default(false),
  isUnlisted: boolean("is_unlisted").default(false),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Merch products
export const merchProducts = pgTable("merch_products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  priceKes: integer("priceKes").notNull(),
  category: text("category").notNull(), // streetwear, accessories, essentials, stickers
  sizes: text("sizes").array(),
  stockTotal: integer("stock_total").notNull().default(0),
  stockRemaining: integer("stock_remaining").notNull().default(0),
  image: text("image").notNull(),
  gallery: text("gallery").array(),
  isArchive: boolean("is_archive").default(false),
  isPreorder: boolean("is_preorder").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Events
export const events = pgTable("events", {
  id: text("id").primaryKey(),
  category: text("category").notNull(), // swarm-nature-hike, studio-live-taping, comedy-showcase, diaspora-date
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  venue: text("venue").notNull(),
  venueCoords: jsonb("venue_coords"),
  date: timestamp("date").notNull(),
  time: text("time").notNull(),
  capacityTotal: integer("capacity_total").notNull(),
  capacityBooked: integer("capacity_booked").notNull().default(0),
  coverImage: text("cover_image").notNull(),
  ticketTiers: jsonb("ticket_tiers").notNull(),
  status: text("status").notNull().default("on-sale"), // on-sale, sold-out, coming-soon, paused
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Ticker terms
export const tickerTerms = pgTable("ticker_terms", {
  id: uuid("id").primaryKey().defaultRandom(),
  term: text("term").notNull().unique(),
  orderIndex: integer("order_index").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Promo codes
export const promoCodes = pgTable("promo_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(), // percent, gift
  value: jsonb("value").notNull(),
  expiresAt: timestamp("expires_at"),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  minSpendKes: integer("min_spendKes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  ward: text("ward").notNull(),
  items: jsonb("items").notNull(),
  totalKes: integer("totalKes").notNull(),
  shippingFee: integer("shipping_fee").notNull().default(0),
  discountAmount: integer("discount_amount").notNull().default(0),
  status: text("status").notNull().default("pending"), // pending, paid, dispatched, delivered
  mpesaReceipt: text("mpesa_receipt"),
  mpesaCheckoutRequest: text("mpesa_checkout_request"),
  shippingMethod: text("shipping_method").notNull().default("standard"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Donors / Superchats
export const donors = pgTable("donors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  amountKes: integer("amountKes").notNull(),
  tier: text("tier").notNull().default("Swarm Citizen"),
  shoutoutPinned: boolean("shoutout_pinned").notNull().default(false),
  mpesaReceipt: text("mpesa_receipt"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Site config
export const siteConfig = pgTable("site_config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Media library (CMS uploads)
export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  originalName: text("original_name").notNull(),
  fileName: text("file_name").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  path: text("path").notNull(),
  url: text("url").notNull(),
  alt: text("alt"),
  category: text("category"), // hero, merch, cast, branding, studio
  tags: text("tags").array(),
  uploadedBy: text("uploaded_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Newsletter subscribers
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  citizenId: text("citizen_id").notNull().unique(),
  subscribedAt: timestamp("subscribed_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

// Tickets
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  citizenId: text("citizen_id").notNull().unique(),
  eventId: text("event_id").notNull(),
  tierId: text("tier_id").notNull(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  qrToken: text("qr_token").notNull().unique(),
  mpesaReceipt: text("mpesa_receipt"),
  status: text("status").notNull().default("issued"), // issued, checked-in, cancelled
  purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
  checkedInAt: timestamp("checked_in_at"),
});
