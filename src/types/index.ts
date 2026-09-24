// ============================================================
// Nzigestan — Shared Types
// ============================================================

export interface CastMember {
  id: string;
  name: string;
  alias?: string;
  role: string;
  micChannel: number;
  gainDb: number;
  image: string;
}

export interface Episode {
  id: string;
  youtubeId: string;
  title: string;
  thumbnail: string;
  duration: string; // e.g. "2:14:38"
  viewCount: number;
  publishedAt: string;
  frequency: EpisodeFrequency;
  tags: string[];
  isPinned?: boolean;
  isUnlisted?: boolean;
  description?: string;
}

export type EpisodeFrequency =
  | "blissful-banter"
  | "comic-diaries"
  | "deep-dives"
  | "republic-archives";

export interface MerchProduct {
  id: string;
  name: string;
  tagline: string;
  priceKes: number;
  category: MerchCategory;
  sizes?: string[];
  sizeStock?: Record<string, number>;
  stockTotal: number;
  stockRemaining: number;
  image: string;
  gallery?: string[];
  isArchive?: boolean;
  isPreorder?: boolean;
}

export type MerchCategory =
  | "streetwear"
  | "accessories"
  | "essentials"
  | "stickers";

export interface CartItem {
  product: MerchProduct;
  size?: string;
  quantity: number;
}

export interface PromoCodeRule {
  type: "percent" | "gift";
  value: number | string;
  expiresAt?: string;
  maxUses?: number;
  usedCount?: number;
  minSpendKes?: number;
  isActive?: boolean;
}

export interface Event {
  id: string;
  category: EventCategory;
  title: string;
  subtitle?: string;
  venue: string;
  venueCoords?: { lat: number; lng: number };
  date: string; // ISO
  time: string; // e.g. "09:00 EAT"
  capacityTotal: number;
  capacityBooked: number;
  coverImage: string;
  ticketTiers: TicketTier[];
  status: "on-sale" | "sold-out" | "coming-soon" | "paused";
}

export type EventCategory =
  | "swarm-nature-hike"
  | "studio-live-taping"
  | "comedy-showcase"
  | "diaspora-date";

export interface TicketTier {
  id: string;
  name: string;
  description: string;
  priceKes: number;
}

export interface BroadcastState {
  isLive: boolean;
  viewerCount: number;
  streamUrl?: string;
  episodeNumber?: number;
  episodeTitle?: string;
  bitrateKbps?: number;
  nextStreamDate?: string; // e.g. "Friday 9:00 PM EAT"
}

export interface SiteConfig {
  paybill: string;
  accountLive: string;
  accountMerch: string;
  accountEvents: string;
  youtubeChannel: string;
  stationTitle: string;
  stationMotto: string;
  heroImageMode?: "custom" | "latest-episode";
  heroCustomImage?: string;
}

export interface SwarmMessage {
  id: string;
  citizenId: string;
  name: string;
  tier: "standard" | "swarm-pioneer" | "gold-locust" | "laf-lyf-crew" | "moderator";
  message: string;
  timestamp: string;
  isMpesa?: boolean;
  mpesaAmount?: number;
}
