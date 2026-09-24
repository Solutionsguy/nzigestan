"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Episode, MerchProduct, Event, PromoCodeRule, SiteConfig } from "@/types";
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
} from "@/lib/constants";

interface Order {
  id: string;
  customerName: string;
  phone: string;
  ward: string;
  items: string;
  totalKes: number;
  status: "paid" | "dispatched" | "delivered" | "pending";
  createdAt: string;
}

interface Donor {
  id: string;
  name: string;
  amountKes: number;
  tier: string;
  shoutoutPinned: boolean;
  date: string;
}

interface AppDataContextType {
  episodes: Episode[];
  merch: MerchProduct[];
  events: Event[];
  tickerTerms: string[];
  promoCodes: Record<string, PromoCodeRule>;
  orders: Order[];
  donors: Donor[];
  config: SiteConfig;
  loading: boolean;
  refreshAll: () => Promise<void>;
  
  // Episode actions
  createEpisode: (ep: Partial<Episode>) => Promise<void>;
  editEpisode: (id: string, updates: Partial<Episode>) => Promise<void>;
  removeEpisode: (id: string) => Promise<void>;

  // Merch actions
  createProduct: (product: Partial<MerchProduct>) => Promise<void>;
  editProduct: (id: string, updates: Partial<MerchProduct>) => Promise<void>;
  adjustStock: (id: string, delta: number) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;

  // Event actions
  createEvent: (ev: Partial<Event>) => Promise<void>;
  editEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  adjustEventCapacity: (id: string, deltaBooked: number) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;

  // Ticker & Config actions
  addTicker: (term: string) => Promise<void>;
  removeTicker: (term: string) => Promise<void>;
  reorderTicker: (sourceIndex: number, destinationIndex: number) => Promise<void>;
  createPromo: (code: string, rule: PromoCodeRule) => Promise<void>;
  updatePromo: (code: string, rule: Partial<PromoCodeRule>) => Promise<void>;
  removePromo: (code: string) => Promise<void>;
  setOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>;
  toggleDonorShoutout: (donorId: string, pinned: boolean) => Promise<void>;
  saveConfig: (newConfig: Partial<SiteConfig>) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [episodes, setEpisodes] = useState<Episode[]>(FALLBACK_SEED_EPISODES);
  const [merch, setMerch] = useState<MerchProduct[]>(MERCH_PRODUCTS);
  const [events, setEvents] = useState<Event[]>(EVENTS);
  const [tickerTerms, setTickerTerms] = useState<string[]>(TICKER_TERMS);
  const [promoCodes, setPromoCodes] = useState<Record<string, PromoCodeRule>>(PROMO_CODES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [config, setConfig] = useState<SiteConfig>({
    paybill: PAYBILL,
    accountLive: ACCOUNT_LIVE,
    accountMerch: ACCOUNT_MERCH,
    accountEvents: ACCOUNT_EVENTS,
    youtubeChannel: "https://www.youtube.com/@thekisianganipodcast/",
    stationTitle: "THE REPUBLIC OF NZIGESTAN",
    stationMotto: "Tuko kwa barabara on this physical odyssey.",
    heroImageMode: "latest-episode",
    heroCustomImage: "/assets/studio/homepage-hero.png",
  });
  const [loading, setLoading] = useState(true);

  const refreshAll = useCallback(async () => {
    try {
      const [epRes, merchRes, evRes, cfgRes] = await Promise.all([
        fetch("/api/episodes", { cache: "no-store" }),
        fetch("/api/merch", { cache: "no-store" }),
        fetch("/api/events", { cache: "no-store" }),
        fetch("/api/config", { cache: "no-store" }),
      ]);

      if (epRes.ok) setEpisodes(await epRes.json());
      if (merchRes.ok) setMerch(await merchRes.json());
      if (evRes.ok) setEvents(await evRes.json());
      if (cfgRes.ok) {
        const data = await cfgRes.json();
        if (data.config) setConfig(data.config);
        if (data.tickerTerms) setTickerTerms(data.tickerTerms);
        if (data.promoCodes) setPromoCodes(data.promoCodes);
        if (data.orders) setOrders(data.orders);
        if (data.donors) setDonors(data.donors);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 10000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_AUTH_SECRET || "32f0a395fa82966d96a2c9ec23d7a04821dd79c133b6cc0909a1e94dc22e4eb2";
  const authHeaders = {
    "Content-Type": "application/json",
    "x-admin-secret": ADMIN_SECRET,
  };

  // Episode mutations
  const createEpisode = async (ep: Partial<Episode>) => {
    await fetch("/api/episodes", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(ep),
    });
    refreshAll();
  };

  const editEpisode = async (id: string, updates: Partial<Episode>) => {
    await fetch("/api/episodes", {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ id, ...updates }),
    });
    refreshAll();
  };

  const removeEpisode = async (id: string) => {
    await fetch(`/api/episodes?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "x-admin-secret": ADMIN_SECRET },
    });
    refreshAll();
  };

  // Merch mutations
  const createProduct = async (product: Partial<MerchProduct>) => {
    await fetch("/api/merch", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(product),
    });
    refreshAll();
  };

  const editProduct = async (id: string, updates: Partial<MerchProduct>) => {
    await fetch("/api/merch", {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ id, ...updates }),
    });
    refreshAll();
  };

  const adjustStock = async (id: string, delta: number) => {
    const p = merch.find((m) => m.id === id);
    if (!p) return;
    const newStock = Math.max(0, p.stockRemaining + delta);
    await editProduct(id, { stockRemaining: newStock });
  };

  const removeProduct = async (id: string) => {
    await fetch(`/api/merch?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "x-admin-secret": ADMIN_SECRET },
    });
    refreshAll();
  };

  // Event mutations
  const createEvent = async (ev: Partial<Event>) => {
    await fetch("/api/events", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(ev),
    });
    refreshAll();
  };

  const editEvent = async (id: string, updates: Partial<Event>) => {
    await fetch("/api/events", {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ id, ...updates }),
    });
    refreshAll();
  };

  const adjustEventCapacity = async (id: string, deltaBooked: number) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    const newBooked = Math.min(ev.capacityTotal, Math.max(0, ev.capacityBooked + deltaBooked));
    const newStatus = newBooked >= ev.capacityTotal ? "sold-out" : "on-sale";
    await editEvent(id, { capacityBooked: newBooked, status: newStatus });
  };

  const removeEvent = async (id: string) => {
    await fetch(`/api/events?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "x-admin-secret": ADMIN_SECRET },
    });
    refreshAll();
  };

  // Ticker & Config mutations
  const addTicker = async (term: string) => {
    const formatted = term.startsWith("#") ? term : `#${term}`;
    await fetch("/api/config", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ action: "addTickerTerm", term: formatted }),
    });
    refreshAll();
  };

  const removeTicker = async (term: string) => {
    await fetch("/api/config", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ action: "removeTickerTerm", term }),
    });
    refreshAll();
  };

  const reorderTicker = async (sourceIndex: number, destinationIndex: number) => {
    await fetch("/api/config", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ action: "reorderTickerTerms", sourceIndex, destinationIndex }),
    });
    refreshAll();
  };

  const createPromo = async (code: string, rule: PromoCodeRule) => {
    await fetch("/api/config", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ action: "addPromoCode", code, rule }),
    });
    refreshAll();
  };

  const updatePromo = async (code: string, rule: Partial<PromoCodeRule>) => {
    await fetch("/api/config", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ action: "updatePromoCode", code, rule }),
    });
    refreshAll();
  };

  const removePromo = async (code: string) => {
    await fetch("/api/config", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ action: "deletePromoCode", code }),
    });
    refreshAll();
  };

  const setOrderStatus = async (orderId: string, status: Order["status"]) => {
    await fetch("/api/config", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ action: "updateOrderStatus", orderId, status }),
    });
    refreshAll();
  };

  const toggleDonorShoutout = async (donorId: string, pinned: boolean) => {
    await fetch("/api/config", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ action: "pinDonorShoutout", donorId, pinned }),
    });
    refreshAll();
  };

  const saveConfig = async (newConfig: Partial<SiteConfig>) => {
    await fetch("/api/config", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ action: "updateConfig", data: newConfig }),
    });
    refreshAll();
  };

  return (
    <AppDataContext.Provider
      value={{
        episodes,
        merch,
        events,
        tickerTerms,
        promoCodes,
        orders,
        donors,
        config,
        loading,
        refreshAll,
        createEpisode,
        editEpisode,
        removeEpisode,
        createProduct,
        editProduct,
        adjustStock,
        removeProduct,
        createEvent,
        editEvent,
        adjustEventCapacity,
        removeEvent,
        addTicker,
        removeTicker,
        reorderTicker,
        createPromo,
        updatePromo,
        removePromo,
        setOrderStatus,
        toggleDonorShoutout,
        saveConfig,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}
