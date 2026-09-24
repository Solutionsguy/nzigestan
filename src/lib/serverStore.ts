import crypto from "crypto";
import type { Episode, MerchProduct, Event, PromoCodeRule } from "@/types";
import {
  FALLBACK_SEED_EPISODES,
  MERCH_PRODUCTS,
  EVENTS,
  TICKER_TERMS,
  PROMO_CODES,
  PAYBILL,
  ACCOUNT_LIVE,
  ACCOUNT_MERCH,
  ACCOUNT_EVENTS,
} from "./constants";
import fs from "fs";
import path from "path";

const STORE_FILE = path.join(process.cwd(), ".data", "store.json");

export interface ServerStore {
  broadcast: {
    isLive: boolean;
    streamTitle: string;
    viewerCount: number;
    nextStreamDate: string;
    ingestionUrl: string;
    youtubeVideoId: string;
    updatedAt: string;
  };
  episodes: Episode[];
  merch: MerchProduct[];
  events: Event[];
  tickerTerms: string[];
  promoCodes: Record<string, PromoCodeRule>;
  orders: Array<{
    id: string;
    customerName: string;
    phone: string;
    ward: string;
    items: string;
    totalKes: number;
    status: "paid" | "dispatched" | "delivered" | "pending";
    createdAt: string;
  }>;
  donors: Array<{
    id: string;
    name: string;
    amountKes: number;
    tier: string;
    shoutoutPinned: boolean;
    date: string;
  }>;
  config: {
    paybill: string;
    accountLive: string;
    accountMerch: string;
    accountEvents: string;
    youtubeChannel: string;
    stationTitle: string;
    stationMotto: string;
    heroImageMode?: "custom" | "latest-episode";
    heroCustomImage?: string;
  };
}

const INITIAL_ORDERS = [
  { id: "NZG-8401", customerName: "Brian Otieno", phone: "+254 712 345 678", ward: "Kilimani", items: "'NZIGE' Hoodie (XL) x 1", totalKes: 4800, status: "paid" as const, createdAt: "10 mins ago" },
  { id: "NZG-8400", customerName: "Faith Wanjiku", phone: "+254 722 890 123", ward: "Westlands", items: "Tuko kwa Barabara Tee (M) x 2", totalKes: 5900, status: "dispatched" as const, createdAt: "1 hr ago" },
  { id: "NZG-8399", customerName: "Dennis Kiprop", phone: "+254 701 456 789", ward: "Eldoret Hub", items: "Dad Hat (1) + Matatu Flask (1)", totalKes: 4500, status: "paid" as const, createdAt: "3 hrs ago" },
  { id: "NZG-8398", customerName: "Sharon Mutua", phone: "+254 733 678 901", ward: "Nairobi CBD", items: "Karura Notebook (2) + Sticker Pack (3)", totalKes: 2500, status: "delivered" as const, createdAt: "Yesterday" },
];

const INITIAL_DONORS = [
  { id: "1", name: "Dr. Omondi (London)", amountKes: 15000, tier: "Gold Locust Oligarch", shoutoutPinned: true, date: "2026-09-21" },
  { id: "2", name: "Wanjiku N. (Seattle)", amountKes: 10000, tier: "Swarm Pioneer", shoutoutPinned: false, date: "2026-09-20" },
  { id: "3", name: "Kevo M. (Kilimani)", amountKes: 5000, tier: "Swarm Citizen", shoutoutPinned: false, date: "2026-09-20" },
  { id: "4", name: "Captain Joe (Mombasa)", amountKes: 4000, tier: "Laf Lyf Crew", shoutoutPinned: false, date: "2026-09-19" },
];

// --- SSE Broadcast ---
type SSESendFn = (event: string, data: unknown) => void;
const sseClients = new Set<SSESendFn>();

export function subscribeToBroadcast(send: SSESendFn): () => void {
  sseClients.add(send);
  return () => sseClients.delete(send);
}

function broadcastEvent(event: string, data: unknown) {
  for (const send of sseClients) {
    try { send(event, data); } catch { sseClients.delete(send); }
  }
}

function saveStore() {
  try {
    const dir = path.dirname(STORE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.warn("[ServerStore] Failed to persist store to disk:", err);
  }
}

function loadStore(): ServerStore | null {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      return JSON.parse(raw) as ServerStore;
    }
  } catch (err) {
    console.warn("[ServerStore] Failed to load store from disk:", err);
  }
  return null;
}

// In-memory global store instance preserved across all API calls
const store: ServerStore = loadStore() ?? {
  broadcast: {
    isLive: false,
    streamTitle: "Nzigestan Live Stream Standby",
    viewerCount: 0,
    nextStreamDate: "Friday 9:00 PM EAT",
    ingestionUrl: "https://www.youtube.com/watch?v=7tkGUXetubY",
    youtubeVideoId: "7tkGUXetubY",
    updatedAt: new Date().toISOString(),
  },
  episodes: [...FALLBACK_SEED_EPISODES],
  merch: [...MERCH_PRODUCTS],
  events: [...EVENTS],
  tickerTerms: [...TICKER_TERMS],
  promoCodes: { ...PROMO_CODES },
  orders: [...INITIAL_ORDERS],
  donors: [...INITIAL_DONORS],
  config: {
    paybill: PAYBILL,
    accountLive: ACCOUNT_LIVE,
    accountMerch: ACCOUNT_MERCH,
    accountEvents: ACCOUNT_EVENTS,
    youtubeChannel: "https://www.youtube.com/@thekisianganipodcast/",
    stationTitle: "THE REPUBLIC OF NZIGESTAN",
    stationMotto: "Tuko kwa barabara on this physical odyssey.",
    heroImageMode: "custom" as const,
    heroCustomImage: "/assets/studio/homepage-hero.png",
  },
};

export function getServerStore(): ServerStore {
  return store;
}

export function updateBroadcast(data: Partial<ServerStore["broadcast"]>) {
  store.broadcast = {
    ...store.broadcast,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  saveStore();
  broadcastEvent("broadcast", store.broadcast);
  return store.broadcast;
}

export function updateConfig(data: Partial<ServerStore["config"]>) {
  store.config = { ...store.config, ...data };
  saveStore();
  broadcastEvent("config", store.config);
  return store.config;
}

export function setTickerTerms(terms: string[]) {
  store.tickerTerms = terms;
  saveStore();
  broadcastEvent("tickerTerms", store.tickerTerms);
  return store.tickerTerms;
}

export function addTickerTerm(term: string) {
  if (!store.tickerTerms.includes(term)) {
    store.tickerTerms.push(term);
  }
  saveStore();
  broadcastEvent("tickerTerms", store.tickerTerms);
  return store.tickerTerms;
}

export function removeTickerTerm(term: string) {
  store.tickerTerms = store.tickerTerms.filter((t) => t !== term);
  saveStore();
  broadcastEvent("tickerTerms", store.tickerTerms);
  return store.tickerTerms;
}

export function setEpisodes(episodes: Episode[]) {
  store.episodes = episodes;
  saveStore();
  broadcastEvent("episodes", store.episodes);
  return store.episodes;
}

export function addEpisode(episode: Episode) {
  store.episodes = [episode, ...store.episodes];
  saveStore();
  broadcastEvent("episodes", store.episodes);
  return store.episodes;
}

export function updateEpisode(id: string, updates: Partial<Episode>) {
  store.episodes = store.episodes.map((ep) =>
    ep.id === id ? { ...ep, ...updates } : ep
  );
  saveStore();
  broadcastEvent("episodes", store.episodes);
  return store.episodes;
}

export function deleteEpisode(id: string) {
  store.episodes = store.episodes.filter((ep) => ep.id !== id);
  saveStore();
  broadcastEvent("episodes", store.episodes);
  return store.episodes;
}

export function setMerch(merch: MerchProduct[]) {
  store.merch = merch;
  saveStore();
  broadcastEvent("merch", store.merch);
  return store.merch;
}

export function addMerchProduct(product: MerchProduct) {
  store.merch = [product, ...store.merch];
  saveStore();
  broadcastEvent("merch", store.merch);
  return store.merch;
}

export function updateMerchProduct(id: string, updates: Partial<MerchProduct>) {
  store.merch = store.merch.map((p) =>
    p.id === id ? { ...p, ...updates } : p
  );
  saveStore();
  broadcastEvent("merch", store.merch);
  return store.merch;
}

export function deleteMerchProduct(id: string) {
  store.merch = store.merch.filter((p) => p.id !== id);
  saveStore();
  broadcastEvent("merch", store.merch);
  return store.merch;
}

export function setEvents(events: Event[]) {
  store.events = events;
  saveStore();
  broadcastEvent("events", store.events);
  return store.events;
}

export function addEvent(event: Event) {
  store.events = [event, ...store.events];
  saveStore();
  broadcastEvent("events", store.events);
  return store.events;
}

export function updateEvent(id: string, updates: Partial<Event>) {
  store.events = store.events.map((e) =>
    e.id === id ? { ...e, ...updates } : e
  );
  saveStore();
  broadcastEvent("events", store.events);
  return store.events;
}

export function deleteEvent(id: string) {
  store.events = store.events.filter((e) => e.id !== id);
  saveStore();
  broadcastEvent("events", store.events);
  return store.events;
}

export function addPromoCode(code: string, rule: PromoCodeRule) {
  store.promoCodes[code.toUpperCase()] = {
    isActive: true,
    ...rule,
  };
  saveStore();
  broadcastEvent("promoCodes", store.promoCodes);
  return store.promoCodes;
}

export function updatePromoCode(code: string, rule: Partial<PromoCodeRule>) {
  const existing = store.promoCodes[code.toUpperCase()];
  if (existing) {
    store.promoCodes[code.toUpperCase()] = { ...existing, ...rule };
  }
  saveStore();
  broadcastEvent("promoCodes", store.promoCodes);
  return store.promoCodes;
}

export function deletePromoCode(code: string) {
  delete store.promoCodes[code.toUpperCase()];
  saveStore();
  broadcastEvent("promoCodes", store.promoCodes);
  return store.promoCodes;
}

export function reorderTickerTerms(sourceIndex: number, destinationIndex: number) {
  if (
    sourceIndex >= 0 &&
    sourceIndex < store.tickerTerms.length &&
    destinationIndex >= 0 &&
    destinationIndex < store.tickerTerms.length
  ) {
    const [moved] = store.tickerTerms.splice(sourceIndex, 1);
    store.tickerTerms.splice(destinationIndex, 0, moved);
  }
  saveStore();
  broadcastEvent("tickerTerms", store.tickerTerms);
  return store.tickerTerms;
}

export function updateOrderStatus(orderId: string, status: "paid" | "dispatched" | "delivered" | "pending") {
  store.orders = store.orders.map((o) =>
    o.id === orderId ? { ...o, status } : o
  );
  saveStore();
  broadcastEvent("orders", store.orders);
  return store.orders;
}

export function addDonor(donor: { name: string; amountKes: number; tier: string; shoutoutPinned: boolean }) {
  store.donors = [...store.donors, { id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], ...donor }];
  saveStore();
  broadcastEvent('donors', store.donors);
  return store.donors;
}

export function addOrder(order: ServerStore["orders"][number]) {
  store.orders = [order, ...store.orders];
  saveStore();
  broadcastEvent("orders", store.orders);
  return store.orders;
}

export function pinDonorShoutout(donorId: string, pinned: boolean) {
  store.donors = store.donors.map((d) =>
    d.id === donorId ? { ...d, shoutoutPinned: pinned } : d
  );
  saveStore();
  broadcastEvent('donors', store.donors);
  return store.donors;
}
