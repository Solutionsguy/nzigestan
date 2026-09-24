"use client";

import { useState } from "react";
import Link from "next/link";
import { useBroadcast } from "@/context/BroadcastContext";
import { useAppData } from "@/context/AppDataContext";
import type { Episode, MerchProduct, Event as NzigestanEvent, EpisodeFrequency, MerchCategory, EventCategory, TicketTier } from "@/types";
import {
  Radio,
  Tv,
  Package,
  Calendar,
  DollarSign,
  Settings,
  Plus,
  Trash2,
  ArrowUpRight,
  Shield,
  RotateCw,
  Sparkles,
  Truck,
  Edit2,
  X,
  Tag,
  Users,
  ArrowUp,
  ArrowDown,
  Download,
  Image as ImageIcon,
  Check,
  PauseCircle,
  PlayCircle,
} from "lucide-react";

type AdminTab = "broadcast" | "youtube" | "merch" | "events" | "coffer" | "settings";

const PRESET_MERCH_IMAGES = [
  { label: "NZIGE Hoodie (Black)", url: "/assets/merch/hoodie-black-male.jpeg" },
  { label: "NZIGE Hoodie (Burgundy)", url: "/assets/merch/hoodie-burgundy-female.jpeg" },
  { label: "NZIGE Hoodie (Heather Grey)", url: "/assets/merch/hoodie-grey-male.jpeg" },
  { label: "NZIGE Hoodie (Jungle Green)", url: "/assets/merch/hoodie-jungle-green-male.jpeg" },
  { label: "Tuko kwa Barabara Tee (Model)", url: "/assets/merch/tshirt-man-model.png" },
  { label: "Swarm Washed Tee (Green)", url: "/assets/merch/tshirt-green.png" },
  { label: "Structured Dad Hat (Black)", url: "/assets/merch/cap-black-male.jpeg" },
  { label: "Structured Dad Hat (White)", url: "/assets/merch/cap-white-nzige.jpeg" },
  { label: "Canvas Tote Bag (Black)", url: "/assets/merch/tote-bag-black.jpeg" },
  { label: "Locust Emblem (HQ)", url: "/assets/branding/locust-emblem-hq-transparent.png" },
];

const PRESET_EVENT_IMAGES = [
  { label: "Studio A Nairobi", url: "/assets/studio/homepage-hero.png" },
  { label: "Podcast Studio Live", url: "/assets/studio/studio-pod.png" },
  { label: "Emmanuel & Cast", url: "/assets/cast/emmanuel-kisiangani.png" },
  { label: "Bashir Halaiki Special", url: "/assets/cast/bashir-halaiki.png" },
  { label: "Nduta Chaos Special", url: "/assets/cast/nduta-kariuki.png" },
];

const PRESET_STUDIO_IMAGES = [
  { label: "Studio A Nairobi (Default Atmosphere)", url: "/assets/studio/homepage-hero.png" },
  { label: "Podcast Studio Pod (Live Session)", url: "/assets/studio/studio-pod.png" },
  { label: "Emmanuel Kisiangani (Host Portrait)", url: "/assets/cast/emmanuel-kisiangani.png" },
  { label: "Bashir Halaiki (Co-Host)", url: "/assets/cast/bashir-halaiki.png" },
  { label: "Nduta Kariuki (Queen of Chaos)", url: "/assets/cast/nduta-kariuki.png" },
  { label: "George Waweru Chinese (Strategist)", url: "/assets/cast/george-waweru.png" },
  { label: "Jack Alita (Humorist)", url: "/assets/cast/jack-alita.png" },
  { label: "Locust Emblem (Obsidian Transparent)", url: "/assets/branding/locust-emblem-hq-transparent.png" },
];

const VERNACULAR_PRESETS = [
  "#TukoKwaBarabara",
  "#ItawesaSana",
  "#YouGuy",
  "#KuingiaMtaro",
  "#Cheki",
  "#HiiNiLafLyf",
  "#RepublicOfNzigestan",
  "#LafLyfLive",
  "#NairobiUnderground",
];

export default function AdminConsolePage() {
  const {
    isLive,
    setIsLive,
    streamTitle,
    setStreamTitle,
    nextStreamDate,
    setNextStreamDate,
    ingestionUrl,
    setIngestionUrl,
  } = useBroadcast();

  const {
    episodes,
    merch,
    events,
    tickerTerms,
    promoCodes,
    orders,
    donors,
    config,
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
  } = useAppData();

  const [activeTab, setActiveTab] = useState<AdminTab>("broadcast");
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced">("idle");
  const [urlSaved, setUrlSaved] = useState(false);

  // Local form drawers
  const [newTickerInput, setNewTickerInput] = useState("");
  const [showAddEpisode, setShowAddEpisode] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddPromo, setShowAddPromo] = useState(false);

  // Edit Modals
  const [editingProduct, setEditingProduct] = useState<MerchProduct | null>(null);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [editingEvent, setEditingEvent] = useState<NzigestanEvent | null>(null);

  // Order filters
  const [orderFilter, setOrderFilter] = useState<"all" | "paid" | "dispatched" | "delivered">("all");

  // New episode form
  const [epForm, setEpForm] = useState({
    title: "",
    youtubeId: "7tkGUXetubY",
    thumbnail: "https://i.ytimg.com/vi/7tkGUXetubY/maxresdefault.jpg",
    frequency: "blissful-banter" as EpisodeFrequency,
    duration: "2:15:00",
    tags: "#TukoKwaBarabara, #ItawesaSana",
  });

  // New product form
  const [prodForm, setProdForm] = useState({
    name: "",
    tagline: "",
    priceKes: 4500,
    category: "streetwear" as MerchCategory,
    stockTotal: 100,
    image: "/assets/merch/hoodie-black-male.jpeg",
    sizes: ["S", "M", "L", "XL", "XXL"],
  });

  // New event form
  const [evForm, setEvForm] = useState({
    title: "",
    subtitle: "The Republic Physical Odyssey",
    category: "swarm-nature-hike" as EventCategory,
    venue: "Ngong Hills, Nairobi",
    date: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
    time: "07:00 EAT",
    capacityTotal: 100,
    priceCitizen: 2500,
    priceVip: 6000,
    coverImage: "/assets/studio/homepage-hero.png",
  });

  // Promo code form
  const [promoForm, setPromoForm] = useState<{
    code: string;
    type: "percent" | "gift";
    value: number | string;
    expiresAt: string;
    minSpendKes: number;
    maxUses: number;
  }>({
    code: "",
    type: "percent",
    value: 15,
    expiresAt: new Date(Date.now() + 86400000 * 30).toISOString().split("T")[0],
    minSpendKes: 0,
    maxUses: 100,
  });

  // Paybill config form
  const [cfgForm, setCfgForm] = useState({
    paybill: config.paybill,
    accountLive: config.accountLive,
    accountMerch: config.accountMerch,
    accountEvents: config.accountEvents || "EVENTS-NZG",
    stationTitle: config.stationTitle || "THE REPUBLIC OF NZIGESTAN",
    stationMotto: config.stationMotto || "Tuko kwa barabara on this physical odyssey.",
  });

  // Homepage Hero visual settings
  const [heroForm, setHeroForm] = useState<{
    mode: "custom" | "latest-episode";
    customImage: string;
  }>({
    mode: config.heroImageMode || "custom",
    customImage: config.heroCustomImage || "/assets/studio/homepage-hero.png",
  });
  const [heroSaved, setHeroSaved] = useState(false);

  const handleHeroFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setHeroForm((prev) => ({ ...prev, mode: "custom", customImage: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveHeroVisual = async () => {
    await saveConfig({
      heroImageMode: heroForm.mode,
      heroCustomImage: heroForm.customImage,
    });
    setHeroSaved(true);
    setTimeout(() => setHeroSaved(false), 2500);
  };

  const handleSyncYouTube = async () => {
    setSyncStatus("syncing");
    try {
      const res = await fetch("/api/youtube/latest?refresh=true", { cache: "no-store" });
      if (res.ok) {
        await refreshAll();
        setSyncStatus("synced");
      } else {
        setSyncStatus("idle");
      }
    } catch (err) {
      console.error("Sync error:", err);
      setSyncStatus("idle");
    } finally {
      setTimeout(() => setSyncStatus("idle"), 3500);
    }
  };

  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTickerInput.trim()) return;
    addTicker(newTickerInput.trim());
    setNewTickerInput("");
  };

  const handleSaveStreamUrl = () => {
    setIngestionUrl(ingestionUrl);
    setUrlSaved(true);
    setTimeout(() => setUrlSaved(false), 2500);
  };

  // Add handlers
  const handleAddEpisodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!epForm.title) return;
    await createEpisode({
      title: epForm.title,
      youtubeId: epForm.youtubeId,
      thumbnail: epForm.thumbnail || `https://i.ytimg.com/vi/${epForm.youtubeId}/maxresdefault.jpg`,
      frequency: epForm.frequency,
      duration: epForm.duration,
      viewCount: 1500,
      tags: epForm.tags.split(",").map((t) => t.trim()),
    });
    setEpForm({
      title: "",
      youtubeId: "7tkGUXetubY",
      thumbnail: "https://i.ytimg.com/vi/7tkGUXetubY/maxresdefault.jpg",
      frequency: "blissful-banter",
      duration: "2:15:00",
      tags: "#TukoKwaBarabara",
    });
    setShowAddEpisode(false);
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name) return;
    await createProduct({
      name: prodForm.name,
      tagline: prodForm.tagline || "Official Nzigestan Drop",
      priceKes: Number(prodForm.priceKes),
      category: prodForm.category,
      stockTotal: Number(prodForm.stockTotal),
      stockRemaining: Number(prodForm.stockTotal),
      image: prodForm.image || "/assets/merch/hoodie-black-male.jpeg",
      sizes: prodForm.category === "streetwear" ? prodForm.sizes : undefined,
    });
    setProdForm({
      name: "",
      tagline: "",
      priceKes: 4500,
      category: "streetwear",
      stockTotal: 100,
      image: "/assets/merch/hoodie-black-male.jpeg",
      sizes: ["S", "M", "L", "XL", "XXL"],
    });
    setShowAddProduct(false);
  };

  const handleAddEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evForm.title) return;
    const tiers: TicketTier[] = [
      {
        id: "citizen",
        name: "Citizen Pass",
        description: "General admission & wilderness medic entry",
        priceKes: Number(evForm.priceCitizen) || 2500,
      },
    ];
    if (evForm.priceVip > 0) {
      tiers.push({
        id: "vip",
        name: "Swarm VIP Pass",
        description: "Front Row + Matatu Thermal Flask Swag Bundle",
        priceKes: Number(evForm.priceVip) || 6000,
      });
    }

    await createEvent({
      title: evForm.title,
      subtitle: evForm.subtitle || "The Republic Physical Odyssey",
      category: evForm.category,
      venue: evForm.venue,
      date: evForm.date,
      time: evForm.time,
      capacityTotal: Number(evForm.capacityTotal),
      capacityBooked: 0,
      coverImage: evForm.coverImage || "/assets/studio/homepage-hero.png",
      status: "on-sale",
      ticketTiers: tiers,
    });
    setEvForm({
      title: "",
      subtitle: "The Republic Physical Odyssey",
      category: "swarm-nature-hike",
      venue: "Ngong Hills, Nairobi",
      date: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
      time: "07:00 EAT",
      capacityTotal: 100,
      priceCitizen: 2500,
      priceVip: 6000,
      coverImage: "/assets/studio/homepage-hero.png",
    });
    setShowAddEvent(false);
  };

  const handleAddPromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.code) return;
    await createPromo(promoForm.code, {
      type: promoForm.type,
      value: promoForm.type === "percent" ? Number(promoForm.value) : "sticker-pack",
      expiresAt: promoForm.expiresAt || undefined,
      minSpendKes: promoForm.minSpendKes > 0 ? Number(promoForm.minSpendKes) : undefined,
      maxUses: promoForm.maxUses > 0 ? Number(promoForm.maxUses) : undefined,
      usedCount: 0,
      isActive: true,
    });
    setPromoForm({
      code: "",
      type: "percent",
      value: 15,
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString().split("T")[0],
      minSpendKes: 0,
      maxUses: 100,
    });
    setShowAddPromo(false);
  };

  // CSV Manifest Export for Boda / Courier
  const handleExportOrdersCsv = () => {
    const headers = ["Order ID", "Customer Name", "Phone", "Ward", "Items", "Total KES", "Status", "Date"];
    const rows = orders.map((o) => [
      o.id,
      `"${o.customerName}"`,
      `"${o.phone}"`,
      `"${o.ward}"`,
      `"${o.items}"`,
      o.totalKes,
      o.status,
      `"${o.createdAt}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nzigestan-orders-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Financial calculations
  const totalSuperchatsKes = donors.reduce((acc, d) => acc + d.amountKes, 0);
  const totalMerchGrossKes = orders.filter((o) => o.status !== "pending").reduce((acc, o) => acc + o.totalKes, 0);
  const totalEventRevenueKes = events.reduce((acc, e) => acc + e.capacityBooked * (e.ticketTiers[0]?.priceKes || 2500), 0);
  const totalSwarmCofferKes = totalSuperchatsKes + totalMerchGrossKes + totalEventRevenueKes;

  const filteredOrders = orders.filter((o) => (orderFilter === "all" ? true : o.status === orderFilter));

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] flex flex-col md:flex-row">
      {/* ── SIDEBAR NAVIGATION ── */}
      <aside className="w-full md:w-64 bg-[#111] border-r border-[#222] p-4 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Logo & Telemetry */}
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#222]">
            <div className="w-9 h-9 bg-[#181818] border border-[#333] flex items-center justify-center">
              <Shield size={18} className="text-[#E50914]" />
            </div>
            <div>
              <span className="font-headline text-lg uppercase tracking-wider block text-white">
                NZIGESTAN
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#E5A93C] block">
                Studio Command Core
              </span>
            </div>
          </div>

          {/* Master Live Status Switch */}
          <div className="bg-[#181818] border border-[#282828] p-3 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isLive ? "bg-[#E50914] animate-pulse" : "bg-[#555]"}`} />
              <div>
                <span className="font-mono text-[10px] text-white font-bold block">
                  {isLive ? "LIVE ON AIR" : "OFFLINE VAULT"}
                </span>
                <span className="font-mono text-[8px] text-[#888] uppercase block">
                  Network Synced
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsLive(!isLive)}
              className={`font-mono text-[9px] font-bold px-3 py-1 uppercase tracking-wider transition ${
                isLive
                  ? "bg-[#E50914] text-white glow-red"
                  : "bg-[#333] text-[#aaa] hover:text-white"
              }`}
            >
              {isLive ? "Go Offline" : "Go Live"}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 font-mono text-[11px] uppercase tracking-wider">
            {[
              { id: "broadcast", label: "Broadcast & Stream", icon: Radio },
              { id: "youtube", label: "Content Vault (Eps)", icon: Tv, count: episodes.length },
              { id: "merch", label: "Merch & Inventory", icon: Package, count: merch.length },
              { id: "events", label: "Tours & Events", icon: Calendar, count: events.length },
              { id: "coffer", label: "Swarm Coffer & Promos", icon: DollarSign },
              { id: "settings", label: "Station Config", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 transition text-left ${
                    isActive
                      ? "bg-[#E50914] text-white font-bold glow-red"
                      : "text-[#888] hover:bg-[#181818] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={15} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.count !== undefined && (
                    <span className="font-mono text-[9px] bg-black/40 px-1.5 py-0.5 text-[#ccc]">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t border-[#222] font-mono text-[10px] text-[#555] space-y-1">
          <p>Studio A · Nairobi Master Core</p>
          <Link href="/" className="text-[#E5A93C] hover:underline block mt-2 flex items-center gap-1 font-bold">
            ← Return to Public Site <ArrowUpRight size={12} />
          </Link>
        </div>
      </aside>

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-6xl">
        {/* Workspace Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-[#222]">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#E5A93C]">
              Operational Suite // {activeTab.toUpperCase()}
            </span>
            <h1 className="font-headline text-3xl uppercase text-white">
              {activeTab === "broadcast" && "BROADCAST & STREAM OPERATIONS"}
              {activeTab === "youtube" && "CONTENT VAULT & EPISODE MANAGER"}
              {activeTab === "merch" && "STREETWEAR MERCH & INVENTORY"}
              {activeTab === "events" && "TOURS, HIKES & CITIZEN GATHERINGS"}
              {activeTab === "coffer" && "SWARM COFFER, M-PESA & PROMOS"}
              {activeTab === "settings" && "STATION CONFIGURATION & PAYBILL"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] bg-[#181818] border border-[#282828] px-3 py-1.5 text-[#aaa] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E5A93C]" />
              Live Central Store Synced
            </span>
          </div>
        </div>

        {/* ── TAB 1: BROADCAST & STREAM OPERATIONS ── */}
        {activeTab === "broadcast" && (
          <div className="space-y-6">
            {/* Stream Settings */}
            <div className="card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-headline text-xl uppercase text-white flex items-center gap-2">
                  <Radio size={18} className="text-[#E50914]" /> Stream Broadcast Controls
                </h2>
                <span className={`font-mono text-[10px] px-2.5 py-1 uppercase font-bold ${isLive ? "bg-[#E50914] text-white" : "bg-[#222] text-[#888]"}`}>
                  {isLive ? "● BROADCASTING LIVE" : "○ OFFLINE STANDBY"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">
                    Live Stream Title
                  </label>
                  <input
                    type="text"
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    className="input-terminal text-xs"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">
                    Next Stream Date (Offline Countdown)
                  </label>
                  <input
                    type="text"
                    value={nextStreamDate}
                    onChange={(e) => setNextStreamDate(e.target.value)}
                    className="input-terminal text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">
                  YouTube Ingestion / HLS Stream URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ingestionUrl}
                    onChange={(e) => setIngestionUrl(e.target.value)}
                    className="input-terminal text-xs flex-1"
                  />
                  <button
                    onClick={handleSaveStreamUrl}
                    className={`btn-primary text-xs shrink-0 flex items-center gap-1 ${urlSaved ? "bg-[#E5A93C]" : ""}`}
                  >
                    {urlSaved ? <Check size={14} /> : null}
                    {urlSaved ? "Saved Across Network!" : "Save URL"}
                  </button>
                </div>
              </div>
            </div>

            {/* Homepage Hero Header Photo Configurator */}
            <div className="card p-6 space-y-5 border-[#E5A93C]/30 bg-[#121212]">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#282828]">
                <div>
                  <h3 className="font-headline text-lg uppercase text-white flex items-center gap-2">
                    <ImageIcon size={18} className="text-[#E5A93C]" /> Homepage Header Hero Photo
                  </h3>
                  <p className="font-sans text-xs text-[#888]">
                    Control the backdrop photo of the public homepage header: dynamically sync with the latest video drop or upload/select a custom studio photo.
                  </p>
                </div>
                <span className="font-mono text-[10px] bg-[#181818] border border-[#333] px-2.5 py-1 text-[#E5A93C]">
                  Active Mode: {heroForm.mode === "latest-episode" ? "Latest Video Drop" : "Custom Studio Photo"}
                </span>
              </div>

              {/* Mode Selection Radios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setHeroForm({ ...heroForm, mode: "latest-episode" })}
                  className={`p-4 border cursor-pointer transition flex items-start gap-3 ${
                    heroForm.mode === "latest-episode"
                      ? "bg-[#181818] border-[#E50914] text-white"
                      : "bg-[#0f0f0f] border-[#242424] text-[#888] hover:border-[#444]"
                  }`}
                >
                  <input
                    type="radio"
                    name="heroMode"
                    checked={heroForm.mode === "latest-episode"}
                    onChange={() => setHeroForm({ ...heroForm, mode: "latest-episode" })}
                    className="mt-1 accent-[#E50914]"
                  />
                  <div>
                    <span className="font-headline text-sm uppercase text-white block">
                      Auto-Sync with Latest Video Thumbnail
                    </span>
                    <span className="font-sans text-[11px] text-[#aaa] block mt-0.5">
                      Automatically uses the thumbnail from the newest YouTube episode drop (currently: {episodes[0]?.title || "Latest Drop"}).
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setHeroForm({ ...heroForm, mode: "custom" })}
                  className={`p-4 border cursor-pointer transition flex items-start gap-3 ${
                    heroForm.mode === "custom"
                      ? "bg-[#181818] border-[#E50914] text-white"
                      : "bg-[#0f0f0f] border-[#242424] text-[#888] hover:border-[#444]"
                  }`}
                >
                  <input
                    type="radio"
                    name="heroMode"
                    checked={heroForm.mode === "custom"}
                    onChange={() => setHeroForm({ ...heroForm, mode: "custom" })}
                    className="mt-1 accent-[#E50914]"
                  />
                  <div>
                    <span className="font-headline text-sm uppercase text-white block">
                      Custom Studio Photo / Upload
                    </span>
                    <span className="font-sans text-[11px] text-[#aaa] block mt-0.5">
                      Choose from official studio photoshoot presets, enter an external image URL, or upload directly from your device.
                    </span>
                  </div>
                </label>
              </div>

              {/* Custom Image Controls (when custom mode is selected) */}
              {heroForm.mode === "custom" && (
                <div className="space-y-3 pt-2 bg-[#161616] p-4 border border-[#282828]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">
                        Select Preset Studio Photo
                      </label>
                      <select
                        value={heroForm.customImage}
                        onChange={(e) => setHeroForm({ ...heroForm, customImage: e.target.value })}
                        className="input-terminal text-xs"
                      >
                        {PRESET_STUDIO_IMAGES.map((img) => (
                          <option key={img.url} value={img.url}>
                            {img.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">
                        Upload Image File from Device
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleHeroFileUpload}
                        className="input-terminal text-xs file:mr-2 file:py-1 file:px-2 file:border-0 file:bg-[#E50914] file:text-white file:text-[10px] file:font-mono file:uppercase file:cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">
                      Or Custom Image URL / Path
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. /assets/studio/homepage-hero.png or https://..."
                      value={heroForm.customImage}
                      onChange={(e) => setHeroForm({ ...heroForm, customImage: e.target.value })}
                      className="input-terminal text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Live Preview Strip */}
              <div className="space-y-1.5">
                <span className="font-mono text-[9px] uppercase text-[#888] block">
                  Live Public Header Preview:
                </span>
                <div className="relative w-full h-40 sm:h-48 bg-[#0a0a0a] border border-[#333] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      heroForm.mode === "latest-episode"
                        ? (episodes[0]?.thumbnail || "/assets/studio/homepage-hero.png")
                        : (heroForm.customImage || "/assets/studio/homepage-hero.png")
                    }
                    alt="Hero Preview"
                    className="w-full h-full object-cover filter brightness-90"
                  />
                  {/* Radial vignette simulation */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#0e0e0e]/70 via-[#0e0e0e]/40 to-[#0e0e0e]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e0e]/90 via-transparent to-[#0e0e0e]/60" />

                  {/* Header mock telemetry overlay */}
                  <div className="absolute top-3 left-4 right-4 flex justify-between items-center font-mono text-[9px] text-white pointer-events-none">
                    <span className="flex items-center gap-1.5 bg-black/60 px-2 py-0.5 border border-white/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-pulse" />
                      {isLive ? "STUDIO A · ON AIR" : "STUDIO A · STANDBY"}
                    </span>
                    <span className="text-[#E5A93C] bg-black/60 px-2 py-0.5 border border-white/10">
                      Active: {heroForm.mode === "latest-episode" ? "Latest Episode Drop" : "Custom Photo"}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-4 font-headline text-xl sm:text-2xl uppercase text-white tracking-tight pointer-events-none">
                    KISIANGANI
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveHeroVisual}
                  className={`btn-primary text-xs flex items-center gap-1.5 ${heroSaved ? "bg-[#E5A93C]" : ""}`}
                >
                  {heroSaved ? <Check size={14} /> : null}
                  {heroSaved ? "Hero Visual Published to Public Site!" : "Save & Publish Header Photo"}
                </button>
              </div>
            </div>

            {/* Lower-Third Live Ticker Tag Editor */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline text-lg uppercase text-white flex items-center gap-2">
                    <Tag size={16} className="text-[#E5A93C]" /> Lower-Third Crawler Hashtags
                  </h3>
                  <p className="font-sans text-[12px] text-[#888]">
                    Hashtags crawl dynamically across the website and live broadcast. Reorder or add tags instantly.
                  </p>
                </div>
                <span className="font-mono text-[11px] text-[#E5A93C] bg-black/50 px-2.5 py-1 border border-[#333]">
                  {tickerTerms.length} Active Tags
                </span>
              </div>

              {/* Add Custom Tag */}
              <form onSubmit={handleAddTicker} className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="e.g. #HiiNiLafLyf"
                  value={newTickerInput}
                  onChange={(e) => setNewTickerInput(e.target.value)}
                  className="input-terminal text-xs flex-1"
                />
                <button type="submit" className="btn-primary text-xs shrink-0 flex items-center gap-1">
                  <Plus size={14} /> Add Tag
                </button>
              </form>

              {/* Preset Tag Quick Adders */}
              <div>
                <span className="font-mono text-[9px] uppercase text-[#666] block mb-1.5">
                  Quick Vernacular Presets (Click to add):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {VERNACULAR_PRESETS.map((tag) => {
                    const exists = tickerTerms.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => (exists ? removeTicker(tag) : addTicker(tag))}
                        className={`font-mono text-[10px] px-2 py-0.5 border transition ${
                          exists
                            ? "bg-[#E50914]/20 border-[#E50914] text-white"
                            : "bg-[#181818] border-[#333] text-[#888] hover:text-white"
                        }`}
                      >
                        {exists ? `✓ ${tag}` : `+ ${tag}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tag List with Reordering Controls */}
              <div className="space-y-1.5 pt-2 border-t border-[#222]">
                <span className="font-mono text-[9px] uppercase text-[#666] block mb-1">
                  Active Marquee Sequence (Use Up/Down to Reorder):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {tickerTerms.map((term, idx) => (
                    <div
                      key={term}
                      className="bg-[#181818] border border-[#333] px-3 py-1.5 font-mono text-[11px] text-white flex items-center justify-between group hover:border-[#E50914]"
                    >
                      <span className="truncate mr-2 font-bold text-[#E5A93C]">{term}</span>
                      <div className="flex items-center gap-1">
                        <button
                          disabled={idx === 0}
                          onClick={() => reorderTicker(idx, idx - 1)}
                          className="p-1 text-[#666] hover:text-white disabled:opacity-20"
                          title="Move Left/Earlier"
                        >
                          <ArrowUp size={12} className="-rotate-90" />
                        </button>
                        <button
                          disabled={idx === tickerTerms.length - 1}
                          onClick={() => reorderTicker(idx, idx + 1)}
                          className="p-1 text-[#666] hover:text-white disabled:opacity-20"
                          title="Move Right/Later"
                        >
                          <ArrowDown size={12} className="-rotate-90" />
                        </button>
                        <button
                          onClick={() => removeTicker(term)}
                          className="p-1 text-[#666] hover:text-[#E50914]"
                          title="Remove Tag"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: CONTENT VAULT (EPISODES) ── */}
        {activeTab === "youtube" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline text-xl uppercase text-white">Episodes &amp; Video Ingestion</h2>
                <p className="font-sans text-xs text-[#888]">Manage episodes, classify frequencies, edit show notes, and sync YouTube.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSyncYouTube}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  <RotateCw size={12} className={syncStatus === "syncing" ? "animate-spin" : ""} />
                  {syncStatus === "syncing" ? "Syncing..." : syncStatus === "synced" ? "Synced!" : "Auto-Sync Channel"}
                </button>
                <button
                  onClick={() => setShowAddEpisode(!showAddEpisode)}
                  className="btn-primary text-xs flex items-center gap-1"
                >
                  <Plus size={13} /> Add Episode
                </button>
              </div>
            </div>

            {/* Add Episode Form Drawer */}
            {showAddEpisode && (
              <form onSubmit={handleAddEpisodeSubmit} className="card p-5 border-[#E50914]/40 bg-[#181818] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#333]">
                  <h3 className="font-headline text-base uppercase text-white">Add New Episode to Vault</h3>
                  <button type="button" onClick={() => setShowAddEpisode(false)} className="text-[#888] hover:text-white">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Episode Title</label>
                    <input
                      type="text"
                      required
                      placeholder="EP. 450 — Episode Title"
                      value={epForm.title}
                      onChange={(e) => setEpForm({ ...epForm, title: e.target.value })}
                      className="input-terminal text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">YouTube Video ID</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 7tkGUXetubY"
                      value={epForm.youtubeId}
                      onChange={(e) => {
                        const yId = e.target.value;
                        setEpForm({
                          ...epForm,
                          youtubeId: yId,
                          thumbnail: `https://i.ytimg.com/vi/${yId}/maxresdefault.jpg`,
                        });
                      }}
                      className="input-terminal text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Frequency Category</label>
                    <select
                      value={epForm.frequency}
                      onChange={(e) => setEpForm({ ...epForm, frequency: e.target.value as EpisodeFrequency })}
                      className="input-terminal text-xs"
                    >
                      <option value="blissful-banter">Freq 01: Blissful Banter</option>
                      <option value="comic-diaries">Freq 02: Comic Diaries &amp; Laf Lyf</option>
                      <option value="deep-dives">Freq 03: Chopping It Up &amp; Deep Dives</option>
                      <option value="republic-archives">Freq 04: Republic Archives</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 2:15:30"
                      value={epForm.duration}
                      onChange={(e) => setEpForm({ ...epForm, duration: e.target.value })}
                      className="input-terminal text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Custom Thumbnail URL</label>
                    <input
                      type="text"
                      placeholder="https://... or /assets/studio/homepage-hero.png"
                      value={epForm.thumbnail}
                      onChange={(e) => setEpForm({ ...epForm, thumbnail: e.target.value })}
                      className="input-terminal text-xs"
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary text-xs">
                  Save Episode to Vault
                </button>
              </form>
            )}

            {/* Episodes List Table */}
            <div className="card overflow-hidden">
              <table className="w-full text-left font-sans text-xs">
                <thead className="bg-[#111] font-mono text-[10px] uppercase tracking-wider text-[#888] border-b border-[#222]">
                  <tr>
                    <th className="p-3">Episode</th>
                    <th className="p-3">Frequency</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Views</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {episodes.map((ep) => (
                    <tr key={ep.id} className="hover:bg-[#181818]/50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 bg-[#0a0a0a] shrink-0 relative overflow-hidden border border-[#333]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={ep.thumbnail} alt={ep.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-semibold text-white truncate max-w-xs">{ep.title}</p>
                            <span className="font-mono text-[10px] text-[#666]">ID: {ep.youtubeId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <select
                          value={ep.frequency}
                          onChange={(e) => editEpisode(ep.id, { frequency: e.target.value as EpisodeFrequency })}
                          className="bg-[#111] border border-[#333] text-[10px] font-mono p-1 text-white"
                        >
                          <option value="blissful-banter">Blissful Banter</option>
                          <option value="comic-diaries">Comic Diaries</option>
                          <option value="deep-dives">Deep Dives</option>
                          <option value="republic-archives">Republic Archives</option>
                        </select>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-[#aaa]">{ep.duration}</td>
                      <td className="p-3 font-mono text-[11px] text-[#aaa]">{ep.viewCount.toLocaleString()}</td>
                      <td className="p-3 text-right space-x-1">
                        <button
                          onClick={() => setEditingEpisode(ep)}
                          className="text-[#888] hover:text-white p-1"
                          title="Edit Episode"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => removeEpisode(ep.id)}
                          className="text-[#666] hover:text-[#E50914] p-1"
                          title="Delete episode"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Episode Edit Modal */}
            {editingEpisode && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="card max-w-lg w-full p-6 bg-[#141414] border-[#E50914]/50 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#333]">
                    <h3 className="font-headline text-lg uppercase text-white">Edit Episode</h3>
                    <button onClick={() => setEditingEpisode(null)} className="text-[#888] hover:text-white">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="space-y-3 font-sans text-xs">
                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Title</label>
                      <input
                        type="text"
                        value={editingEpisode.title}
                        onChange={(e) => setEditingEpisode({ ...editingEpisode, title: e.target.value })}
                        className="input-terminal text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">YouTube ID</label>
                        <input
                          type="text"
                          value={editingEpisode.youtubeId}
                          onChange={(e) => setEditingEpisode({ ...editingEpisode, youtubeId: e.target.value })}
                          className="input-terminal text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Duration</label>
                        <input
                          type="text"
                          value={editingEpisode.duration}
                          onChange={(e) => setEditingEpisode({ ...editingEpisode, duration: e.target.value })}
                          className="input-terminal text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Thumbnail URL</label>
                      <input
                        type="text"
                        value={editingEpisode.thumbnail}
                        onChange={(e) => setEditingEpisode({ ...editingEpisode, thumbnail: e.target.value })}
                        className="input-terminal text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Frequency</label>
                      <select
                        value={editingEpisode.frequency}
                        onChange={(e) => setEditingEpisode({ ...editingEpisode, frequency: e.target.value as EpisodeFrequency })}
                        className="input-terminal text-xs"
                      >
                        <option value="blissful-banter">Freq 01: Blissful Banter</option>
                        <option value="comic-diaries">Freq 02: Comic Diaries &amp; Laf Lyf</option>
                        <option value="deep-dives">Freq 03: Chopping It Up &amp; Deep Dives</option>
                        <option value="republic-archives">Freq 04: Republic Archives</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-[#222]">
                    <button onClick={() => setEditingEpisode(null)} className="btn-secondary text-xs">
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        await editEpisode(editingEpisode.id, editingEpisode);
                        setEditingEpisode(null);
                      }}
                      className="btn-primary text-xs"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: STREETWEAR MERCH & INVENTORY ── */}
        {activeTab === "merch" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline text-xl uppercase text-white">Merch Catalog &amp; Real-time Stock</h2>
                <p className="font-sans text-xs text-[#888]">Update product images, adjust stock counters, and dispatch customer orders.</p>
              </div>
              <button
                onClick={() => setShowAddProduct(!showAddProduct)}
                className="btn-primary text-xs flex items-center gap-1"
              >
                <Plus size={13} /> Add Product
              </button>
            </div>

            {/* Add Product Drawer */}
            {showAddProduct && (
              <form onSubmit={handleAddProductSubmit} className="card p-5 border-[#E50914]/40 bg-[#181818] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#333]">
                  <h3 className="font-headline text-base uppercase text-white">Add New Product</h3>
                  <button type="button" onClick={() => setShowAddProduct(false)} className="text-[#888] hover:text-white">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Product Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 'NZIGE' Oversized Tee"
                      value={prodForm.name}
                      onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                      className="input-terminal text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Price (KES)</label>
                    <input
                      type="number"
                      required
                      value={prodForm.priceKes}
                      onChange={(e) => setProdForm({ ...prodForm, priceKes: Number(e.target.value) })}
                      className="input-terminal text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Total Stock Run</label>
                    <input
                      type="number"
                      required
                      value={prodForm.stockTotal}
                      onChange={(e) => setProdForm({ ...prodForm, stockTotal: Number(e.target.value) })}
                      className="input-terminal text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Tagline</label>
                    <input
                      type="text"
                      placeholder="240 GSM washed charcoal fleece"
                      value={prodForm.tagline}
                      onChange={(e) => setProdForm({ ...prodForm, tagline: e.target.value })}
                      className="input-terminal text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Category</label>
                    <select
                      value={prodForm.category}
                      onChange={(e) => setProdForm({ ...prodForm, category: e.target.value as MerchCategory })}
                      className="input-terminal text-xs"
                    >
                      <option value="streetwear">Streetwear</option>
                      <option value="accessories">Accessories</option>
                      <option value="essentials">Essentials</option>
                      <option value="stickers">Stickers</option>
                    </select>
                  </div>

                  {/* Image Selector */}
                  <div className="sm:col-span-3 space-y-1.5">
                    <label className="font-mono text-[10px] uppercase text-[#888] block">Product Image</label>
                    <div className="flex gap-2">
                      <select
                        onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                        value={prodForm.image}
                        className="input-terminal text-xs flex-1"
                      >
                        {PRESET_MERCH_IMAGES.map((p) => (
                          <option key={p.url} value={p.url}>
                            {p.label} ({p.url})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Or custom Image URL"
                        value={prodForm.image}
                        onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                        className="input-terminal text-xs flex-1"
                      />
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn-primary text-xs">
                  Create Product Drop
                </button>
              </form>
            )}

            {/* Inventory Grid with Inline Adjustments & Photo Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {merch.map((product) => {
                const isCritical = product.stockRemaining < 15;
                return (
                  <div key={product.id} className="card p-4 flex flex-col justify-between group">
                    <div>
                      {/* Product Image Preview */}
                      <div className="w-full h-36 bg-[#161616] border border-[#282828] relative overflow-hidden mb-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="bg-black/70 hover:bg-[#E50914] text-white p-1.5 backdrop-blur-sm border border-white/10"
                            title="Edit Product & Image"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => removeProduct(product.id)}
                            className="bg-black/70 hover:bg-[#E50914] text-white p-1.5 backdrop-blur-sm border border-white/10"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h4 className="font-headline text-base uppercase text-white">{product.name}</h4>
                          <span className="font-mono text-[10px] text-[#E5A93C] uppercase">{product.category}</span>
                        </div>
                      </div>
                      <p className="font-sans text-[11px] text-[#888] mb-3 line-clamp-2">{product.tagline}</p>
                    </div>

                    <div className="pt-3 border-t border-[#222] space-y-2">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-white font-bold">KES {product.priceKes.toLocaleString()}</span>
                        <span className={`font-bold ${isCritical ? "text-[#E50914]" : "text-[#aaa]"}`}>
                          [ {product.stockRemaining} / {product.stockTotal} LEFT ]
                        </span>
                      </div>

                      {/* Inline Stock Adjustment Buttons */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="font-mono text-[9px] uppercase text-[#666]">Stock:</span>
                        <button
                          onClick={() => adjustStock(product.id, -5)}
                          className="bg-[#222] hover:bg-[#333] text-white text-[10px] font-mono px-2 py-0.5"
                        >
                          -5
                        </button>
                        <button
                          onClick={() => adjustStock(product.id, -1)}
                          className="bg-[#222] hover:bg-[#333] text-white text-[10px] font-mono px-2 py-0.5"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => adjustStock(product.id, +1)}
                          className="bg-[#222] hover:bg-[#333] text-white text-[10px] font-mono px-2 py-0.5"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => adjustStock(product.id, +5)}
                          className="bg-[#222] hover:bg-[#333] text-white text-[10px] font-mono px-2 py-0.5"
                        >
                          +5
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Product Edit Modal */}
            {editingProduct && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="card max-w-lg w-full p-6 bg-[#141414] border-[#E50914]/50 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#333]">
                    <h3 className="font-headline text-lg uppercase text-white">Edit Product &amp; Image</h3>
                    <button onClick={() => setEditingProduct(null)} className="text-[#888] hover:text-white">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="space-y-3 font-sans text-xs">
                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Product Name</label>
                      <input
                        type="text"
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        className="input-terminal text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Tagline</label>
                      <input
                        type="text"
                        value={editingProduct.tagline}
                        onChange={(e) => setEditingProduct({ ...editingProduct, tagline: e.target.value })}
                        className="input-terminal text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Price (KES)</label>
                        <input
                          type="number"
                          value={editingProduct.priceKes}
                          onChange={(e) => setEditingProduct({ ...editingProduct, priceKes: Number(e.target.value) })}
                          className="input-terminal text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Remaining Stock</label>
                        <input
                          type="number"
                          value={editingProduct.stockRemaining}
                          onChange={(e) => setEditingProduct({ ...editingProduct, stockRemaining: Number(e.target.value) })}
                          className="input-terminal text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Total Run</label>
                        <input
                          type="number"
                          value={editingProduct.stockTotal}
                          onChange={(e) => setEditingProduct({ ...editingProduct, stockTotal: Number(e.target.value) })}
                          className="input-terminal text-xs"
                        />
                      </div>
                    </div>
                    {/* Image Update */}
                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Photo / Image Source</label>
                      <select
                        onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                        value={editingProduct.image}
                        className="input-terminal text-xs mb-1.5"
                      >
                        {PRESET_MERCH_IMAGES.map((p) => (
                          <option key={p.url} value={p.url}>
                            {p.label} ({p.url})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Or custom Image URL"
                        value={editingProduct.image}
                        onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                        className="input-terminal text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-[#222]">
                    <button onClick={() => setEditingProduct(null)} className="btn-secondary text-xs">
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        await editProduct(editingProduct.id, editingProduct);
                        setEditingProduct(null);
                      }}
                      className="btn-primary text-xs"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Manifest Table with Filters & CSV Export */}
            <div className="card p-5 mt-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-headline text-lg uppercase text-white flex items-center gap-2">
                    <Truck size={16} className="text-[#E5A93C]" /> Customer Orders &amp; Delivery Dispatch
                  </h3>
                  <p className="font-sans text-xs text-[#888]">Filter orders by status and export manifest for courier riders.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportOrdersCsv}
                    className="btn-secondary text-xs flex items-center gap-1.5"
                  >
                    <Download size={13} /> Export Courier CSV
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 border-b border-[#222] pb-2 font-mono text-[11px] uppercase">
                {[
                  { id: "all", label: "All Orders" },
                  { id: "paid", label: "Pending Packaging" },
                  { id: "dispatched", label: "Dispatched" },
                  { id: "delivered", label: "Delivered" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setOrderFilter(f.id as typeof orderFilter)}
                    className={`px-3 py-1 transition ${
                      orderFilter === f.id
                        ? "bg-[#E50914] text-white font-bold"
                        : "text-[#888] hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead className="bg-[#111] font-mono text-[10px] uppercase text-[#888] border-b border-[#222]">
                    <tr>
                      <th className="p-2.5">Order ID</th>
                      <th className="p-2.5">Customer</th>
                      <th className="p-2.5">Ward / Delivery</th>
                      <th className="p-2.5">Items</th>
                      <th className="p-2.5">Total</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 text-right">Fulfill</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="p-2.5 font-mono text-[10px] text-[#E5A93C] font-bold">{order.id}</td>
                        <td className="p-2.5">
                          <p className="font-semibold text-white">{order.customerName}</p>
                          <span className="font-mono text-[9px] text-[#666]">{order.phone}</span>
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-[#aaa]">{order.ward}</td>
                        <td className="p-2.5 text-[#ddd] max-w-xs truncate">{order.items}</td>
                        <td className="p-2.5 font-mono text-white font-bold">KES {order.totalKes.toLocaleString()}</td>
                        <td className="p-2.5">
                          <span className={`font-mono text-[9px] uppercase px-2 py-0.5 ${
                            order.status === "paid"
                              ? "bg-[#E5A93C]/20 text-[#E5A93C]"
                              : order.status === "dispatched"
                              ? "bg-[#E5A93C]/20 text-[#E5A93C]"
                              : "bg-[#222] text-[#888]"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          {order.status === "paid" && (
                            <button
                              onClick={() => setOrderStatus(order.id, "dispatched")}
                              className="btn-secondary text-[9px] py-1 px-2"
                            >
                              Dispatch Boda
                            </button>
                          )}
                          {order.status === "dispatched" && (
                            <button
                              onClick={() => setOrderStatus(order.id, "delivered")}
                              className="bg-[#E5A93C] text-white font-mono text-[9px] py-1 px-2 uppercase"
                            >
                              Mark Delivered
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: TOURS, HIKES & EVENTS ── */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline text-xl uppercase text-white">Tours &amp; Citizen Gatherings</h2>
                <p className="font-sans text-xs text-[#888]">Create community expeditions, configure multi-tier passes, and track capacity.</p>
              </div>
              <button
                onClick={() => setShowAddEvent(!showAddEvent)}
                className="btn-primary text-xs flex items-center gap-1"
              >
                <Plus size={13} /> Create Event
              </button>
            </div>

            {/* Create Event Drawer */}
            {showAddEvent && (
              <form onSubmit={handleAddEventSubmit} className="card p-5 border-[#E50914]/40 bg-[#181818] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#333]">
                  <h3 className="font-headline text-base uppercase text-white">Create New Event</h3>
                  <button type="button" onClick={() => setShowAddEvent(false)} className="text-[#888] hover:text-white">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Event Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Swarm Ridge Hike #03"
                      value={evForm.title}
                      onChange={(e) => setEvForm({ ...evForm, title: e.target.value })}
                      className="input-terminal text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Venue</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ngong Hills, Nairobi"
                      value={evForm.venue}
                      onChange={(e) => setEvForm({ ...evForm, venue: e.target.value })}
                      className="input-terminal text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={evForm.date}
                      onChange={(e) => setEvForm({ ...evForm, date: e.target.value })}
                      className="input-terminal text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Gate Capacity</label>
                    <input
                      type="number"
                      required
                      value={evForm.capacityTotal}
                      onChange={(e) => setEvForm({ ...evForm, capacityTotal: Number(e.target.value) })}
                      className="input-terminal text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Citizen Pass (KES)</label>
                    <input
                      type="number"
                      required
                      value={evForm.priceCitizen}
                      onChange={(e) => setEvForm({ ...evForm, priceCitizen: Number(e.target.value) })}
                      className="input-terminal text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">VIP Swarm Pass (KES)</label>
                    <input
                      type="number"
                      value={evForm.priceVip}
                      onChange={(e) => setEvForm({ ...evForm, priceVip: Number(e.target.value) })}
                      className="input-terminal text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Cover Image</label>
                    <select
                      onChange={(e) => setEvForm({ ...evForm, coverImage: e.target.value })}
                      value={evForm.coverImage}
                      className="input-terminal text-xs"
                    >
                      {PRESET_EVENT_IMAGES.map((img) => (
                        <option key={img.url} value={img.url}>
                          {img.label} ({img.url})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn-primary text-xs">
                  Publish Event Gathering
                </button>
              </form>
            )}

            {/* Events Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((event) => {
                const pct = Math.round((event.capacityBooked / event.capacityTotal) * 100);
                return (
                  <div key={event.id} className="card p-5 flex flex-col justify-between">
                    <div>
                      {/* Cover Photo */}
                      <div className="w-full h-32 bg-[#161616] border border-[#282828] relative overflow-hidden mb-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            onClick={() => setEditingEvent(event)}
                            className="bg-black/70 hover:bg-[#E50914] text-white p-1.5 backdrop-blur-sm border border-white/10"
                            title="Edit Event"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => removeEvent(event.id)}
                            className="bg-black/70 hover:bg-[#E50914] text-white p-1.5 backdrop-blur-sm border border-white/10"
                            title="Delete event"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <span className="font-mono text-[9px] uppercase tracking-wider bg-[#E50914] text-white px-2 py-0.5 inline-block mb-1">
                        {event.category}
                      </span>
                      <h3 className="font-headline text-xl uppercase text-white">{event.title}</h3>
                      <p className="font-mono text-[11px] text-[#888] mb-1">{event.venue}</p>
                      <p className="font-mono text-[11px] text-[#E5A93C] mb-3">{event.date} · {event.time}</p>

                      {/* Ticket Tiers */}
                      <div className="space-y-1 mb-3">
                        {event.ticketTiers.map((tier) => (
                          <div key={tier.id} className="flex justify-between font-mono text-[10px] text-[#ccc] bg-[#141414] p-1.5 border border-[#242424]">
                            <span>{tier.name}</span>
                            <span className="text-[#E5A93C] font-bold">KES {tier.priceKes.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      {/* Capacity Progress Bar */}
                      <div className="space-y-1 mb-4">
                        <div className="flex justify-between font-mono text-[10px] text-[#aaa]">
                          <span>Capacity: {event.capacityBooked} / {event.capacityTotal} Booked</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-[#222]">
                          <div className="h-full bg-[#E50914]" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#222] flex items-center justify-between">
                      {/* Quick Capacity Increment Buttons */}
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[9px] uppercase text-[#666]">Booked:</span>
                        <button
                          onClick={() => adjustEventCapacity(event.id, -1)}
                          className="bg-[#222] hover:bg-[#333] text-white text-[10px] font-mono px-2 py-0.5"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => adjustEventCapacity(event.id, +1)}
                          className="bg-[#222] hover:bg-[#333] text-white text-[10px] font-mono px-2 py-0.5"
                        >
                          +1
                        </button>
                      </div>

                      {/* Status Toggle */}
                      <select
                        value={event.status}
                        onChange={(e) => editEvent(event.id, { status: e.target.value as NzigestanEvent["status"] })}
                        className="bg-[#111] border border-[#333] text-[10px] font-mono p-1 text-white"
                      >
                        <option value="on-sale">On Sale</option>
                        <option value="sold-out">Sold Out</option>
                        <option value="paused">Paused</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Event Edit Modal */}
            {editingEvent && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="card max-w-lg w-full p-6 bg-[#141414] border-[#E50914]/50 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#333]">
                    <h3 className="font-headline text-lg uppercase text-white">Edit Event</h3>
                    <button onClick={() => setEditingEvent(null)} className="text-[#888] hover:text-white">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="space-y-3 font-sans text-xs">
                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Title</label>
                      <input
                        type="text"
                        value={editingEvent.title}
                        onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                        className="input-terminal text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Venue</label>
                      <input
                        type="text"
                        value={editingEvent.venue}
                        onChange={(e) => setEditingEvent({ ...editingEvent, venue: e.target.value })}
                        className="input-terminal text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Date</label>
                        <input
                          type="date"
                          value={editingEvent.date}
                          onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                          className="input-terminal text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Total Capacity</label>
                        <input
                          type="number"
                          value={editingEvent.capacityTotal}
                          onChange={(e) => setEditingEvent({ ...editingEvent, capacityTotal: Number(e.target.value) })}
                          className="input-terminal text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Cover Image URL</label>
                      <input
                        type="text"
                        value={editingEvent.coverImage}
                        onChange={(e) => setEditingEvent({ ...editingEvent, coverImage: e.target.value })}
                        className="input-terminal text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-[#222]">
                    <button onClick={() => setEditingEvent(null)} className="btn-secondary text-xs">
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        await editEvent(editingEvent.id, editingEvent);
                        setEditingEvent(null);
                      }}
                      className="btn-primary text-xs"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 5: SWARM COFFER, M-PESA & PROMOS ── */}
        {activeTab === "coffer" && (
          <div className="space-y-6">
            {/* Financial Telemetry Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-4 bg-[#141414] border-[#E5A93C]/30">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#888] block mb-1">
                  Gross Swarm Coffer
                </span>
                <div className="font-headline text-2xl text-[#E5A93C]">
                  KES {totalSwarmCofferKes.toLocaleString()}
                </div>
                <span className="font-mono text-[9px] text-[#555]">All Inflows Reconciled</span>
              </div>
              <div className="card p-4">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#888] block mb-1">
                  M-Pesa Superchats (Live)
                </span>
                <div className="font-headline text-2xl text-white">
                  KES {totalSuperchatsKes.toLocaleString()}
                </div>
                <span className="font-mono text-[9px] text-[#E5A93C]">Account: {config.accountLive}</span>
              </div>
              <div className="card p-4">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#888] block mb-1">
                  Merch Store Sales
                </span>
                <div className="font-headline text-2xl text-white">
                  KES {totalMerchGrossKes.toLocaleString()}
                </div>
                <span className="font-mono text-[9px] text-[#E5A93C]">Account: {config.accountMerch}</span>
              </div>
              <div className="card p-4">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#888] block mb-1">
                  Tour &amp; Gathering Passes
                </span>
                <div className="font-headline text-2xl text-white">
                  KES {totalEventRevenueKes.toLocaleString()}
                </div>
                <span className="font-mono text-[9px] text-[#E5A93C]">Account: {config.accountEvents || "EVENTS-NZG"}</span>
              </div>
            </div>

            {/* Creator Splits Breakdown */}
            <div className="card p-5 bg-[#121212] space-y-3">
              <h3 className="font-headline text-base uppercase text-white flex items-center gap-2">
                <DollarSign size={16} className="text-[#E5A93C]" /> B2C Creator Splits Breakdown (Daraja 2.0 Rails)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                <div className="bg-[#181818] p-3 border border-[#282828]">
                  <span className="text-[#888] block text-[10px]">Studio &amp; Tech Ops (40%)</span>
                  <span className="text-white font-bold text-sm">KES {Math.round(totalSwarmCofferKes * 0.4).toLocaleString()}</span>
                </div>
                <div className="bg-[#181818] p-3 border border-[#282828]">
                  <span className="text-[#888] block text-[10px]">Cast &amp; Laf Lyf Crew Splits (40%)</span>
                  <span className="text-white font-bold text-sm">KES {Math.round(totalSwarmCofferKes * 0.4).toLocaleString()}</span>
                </div>
                <div className="bg-[#181818] p-3 border border-[#282828]">
                  <span className="text-[#888] block text-[10px]">Swarm &amp; Wilderness Fund (20%)</span>
                  <span className="text-[#E5A93C] font-bold text-sm">KES {Math.round(totalSwarmCofferKes * 0.2).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Promo Code Generator with Advanced Controls */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline text-lg uppercase text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-[#E5A93C]" /> Inside Joke Promo Codes &amp; Coupons
                  </h3>
                  <p className="font-sans text-xs text-[#888]">
                    Configure discount percentages, gift bundles, expiration dates, and minimum cart spend limits.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddPromo(!showAddPromo)}
                  className="btn-primary text-xs flex items-center gap-1"
                >
                  <Plus size={13} /> Add Promo Code
                </button>
              </div>

              {showAddPromo && (
                <form onSubmit={handleAddPromoSubmit} className="bg-[#181818] p-5 border border-[#333] space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#333]">
                    <h4 className="font-headline text-sm uppercase text-white">Create New Promo Code</h4>
                    <button type="button" onClick={() => setShowAddPromo(false)} className="text-[#888] hover:text-white">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Code Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. ITAWESASANA"
                        value={promoForm.code}
                        onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                        className="input-terminal text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Reward Type</label>
                      <select
                        value={promoForm.type}
                        onChange={(e) => setPromoForm({ ...promoForm, type: e.target.value as "percent" | "gift" })}
                        className="input-terminal text-xs"
                      >
                        <option value="percent">Percentage Discount (%)</option>
                        <option value="gift">Free Fan Sticker Pack</option>
                      </select>
                    </div>
                    {promoForm.type === "percent" && (
                      <div>
                        <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Discount (%)</label>
                        <input
                          type="number"
                          value={promoForm.value}
                          onChange={(e) => setPromoForm({ ...promoForm, value: Number(e.target.value) })}
                          className="input-terminal text-xs"
                        />
                      </div>
                    )}
                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Expiration Date</label>
                      <input
                        type="date"
                        value={promoForm.expiresAt}
                        onChange={(e) => setPromoForm({ ...promoForm, expiresAt: e.target.value })}
                        className="input-terminal text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Min Spend (KES)</label>
                      <input
                        type="number"
                        placeholder="0 for no minimum"
                        value={promoForm.minSpendKes}
                        onChange={(e) => setPromoForm({ ...promoForm, minSpendKes: Number(e.target.value) })}
                        className="input-terminal text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Max Redemptions</label>
                      <input
                        type="number"
                        placeholder="100"
                        value={promoForm.maxUses}
                        onChange={(e) => setPromoForm({ ...promoForm, maxUses: Number(e.target.value) })}
                        className="input-terminal text-xs"
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary text-xs">
                    Save Promo Code
                  </button>
                </form>
              )}

              {/* Promo Codes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(promoCodes).map(([code, rule]) => {
                  const isExpired = rule.expiresAt ? new Date() > new Date(rule.expiresAt) : false;
                  const isActive = rule.isActive !== false && !isExpired;

                  return (
                    <div
                      key={code}
                      className={`bg-[#111] border p-3 flex flex-col justify-between transition ${
                        !isActive ? "border-neutral-800 opacity-60" : "border-[#282828] hover:border-[#E5A93C]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-mono text-sm font-bold text-[#E5A93C]">{code}</p>
                          <span
                            className={`font-mono text-[9px] uppercase px-1.5 py-0.5 ${
                              isExpired
                                ? "bg-neutral-800 text-neutral-400"
                                : isActive
                                ? "bg-[#E5A93C]/20 text-[#E5A93C]"
                                : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {isExpired ? "Expired" : isActive ? "Active" : "Paused"}
                          </span>
                        </div>
                        <p className="font-mono text-[11px] text-white">
                          {rule.type === "percent" ? `${rule.value}% OFF Order` : "Free Sticker Pack"}
                        </p>
                        <div className="space-y-0.5 mt-2 font-mono text-[10px] text-[#777]">
                          {rule.expiresAt && <p>Expires: {rule.expiresAt}</p>}
                          {rule.minSpendKes && rule.minSpendKes > 0 && <p>Min Order: KES {rule.minSpendKes.toLocaleString()}</p>}
                          {rule.maxUses && <p>Uses: {rule.usedCount || 0} / {rule.maxUses}</p>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#222]">
                        <button
                          onClick={() => updatePromo(code, { isActive: !rule.isActive })}
                          className="font-mono text-[10px] text-[#888] hover:text-white flex items-center gap-1"
                        >
                          {rule.isActive !== false ? <PauseCircle size={13} /> : <PlayCircle size={13} />}
                          {rule.isActive !== false ? "Pause" : "Resume"}
                        </button>
                        <button
                          onClick={() => removePromo(code)}
                          className="text-[#666] hover:text-[#E50914] p-1"
                          title="Delete Code"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Swarm Oligarchs Donor Leaderboard */}
            <div className="card p-6">
              <h3 className="font-headline text-lg uppercase text-white mb-2 flex items-center gap-2">
                <Users size={16} className="text-[#E50914]" /> Swarm Oligarchs &amp; Top Patrons
              </h3>
              <p className="font-sans text-xs text-[#888] mb-4">Send live pinned shoutouts to live stream viewers directly.</p>

              <div className="divide-y divide-[#222]">
                {donors.map((donor) => (
                  <div key={donor.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white text-sm">{donor.name}</p>
                      <span className="font-mono text-[10px] text-[#E5A93C]">{donor.tier}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm font-bold text-white">KES {donor.amountKes.toLocaleString()}</span>
                      <button
                        onClick={() => toggleDonorShoutout(donor.id, !donor.shoutoutPinned)}
                        className={`btn-secondary text-[9px] px-2.5 py-1 ${donor.shoutoutPinned ? "border-[#E50914] text-[#E50914]" : ""}`}
                      >
                        {donor.shoutoutPinned ? "Shoutout Pinned" : "Pin Shoutout"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: STATION CONFIGURATION ── */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="card p-6 max-w-2xl space-y-5">
              <h2 className="font-headline text-xl uppercase text-white">Safaricom Paybill &amp; Global Station Config</h2>

              <div className="space-y-4">
                <div>
                  <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">M-Pesa Business Number (Paybill)</label>
                  <input
                    type="text"
                    value={cfgForm.paybill}
                    onChange={(e) => setCfgForm({ ...cfgForm, paybill: e.target.value })}
                    className="input-terminal text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Live Superchat Ref</label>
                    <input
                      type="text"
                      value={cfgForm.accountLive}
                      onChange={(e) => setCfgForm({ ...cfgForm, accountLive: e.target.value })}
                      className="input-terminal text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Merch Store Ref</label>
                    <input
                      type="text"
                      value={cfgForm.accountMerch}
                      onChange={(e) => setCfgForm({ ...cfgForm, accountMerch: e.target.value })}
                      className="input-terminal text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Events Ticketing Ref</label>
                    <input
                      type="text"
                      value={cfgForm.accountEvents}
                      onChange={(e) => setCfgForm({ ...cfgForm, accountEvents: e.target.value })}
                      className="input-terminal text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Station Title</label>
                    <input
                      type="text"
                      value={cfgForm.stationTitle}
                      onChange={(e) => setCfgForm({ ...cfgForm, stationTitle: e.target.value })}
                      className="input-terminal text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">Station Motto / Tagline</label>
                    <input
                      type="text"
                      value={cfgForm.stationMotto}
                      onChange={(e) => setCfgForm({ ...cfgForm, stationMotto: e.target.value })}
                      className="input-terminal text-xs"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={async () => {
                  await saveConfig(cfgForm);
                  alert("Station configuration saved and broadcasted across network!");
                }}
                className="btn-primary text-xs"
              >
                Save Configuration
              </button>
            </div>

            {/* API Integration Health Status */}
            <div className="card p-6 max-w-2xl space-y-3">
              <h3 className="font-headline text-base uppercase text-white">System API &amp; Webhook Health</h3>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5 bg-[#141414] border border-[#282828]">
                  <span className="text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#E5A93C]" />
                    Safaricom Daraja 2.0 Rails
                  </span>
                  <span className="text-[#E5A93C]">PAYBILL {config.paybill} ACTIVE</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[#141414] border border-[#282828]">
                  <span className="text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#E5A93C]" />
                    YouTube Data API v3 Ingestion
                  </span>
                  <span className="text-[#aaa]">412 / 10,000 Quota Units</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[#141414] border border-[#282828]">
                  <span className="text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#E5A93C]" />
                    WebSub / PubSubHubbub Stream Hook
                  </span>
                  <span className="text-[#E5A93C]">ONLINE · 15s Latency</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
