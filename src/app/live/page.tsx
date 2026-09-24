"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import MobileNav from "@/components/layout/MobileNav";
import { CAST, MERCH_PRODUCTS, PAYBILL, ACCOUNT_LIVE } from "@/lib/constants";
import { useBroadcast } from "@/context/BroadcastContext";
import {
  Mic,
  Users,
  Zap,
  ShoppingBag,
  ArrowRight,
  Send,
  X,
  Radio,
  Sparkles,
  MessageSquare,
  Play,
  Calendar,
} from "lucide-react";

interface ChatMessage {
  id: string;
  name: string;
  role: string;
  avatar: string;
  text: string;
  time: string;
  isSuperchat?: boolean;
  amount?: number;
  badgeColor?: string;
}

const INITIAL_CHAT: ChatMessage[] = [
  {
    id: "1",
    name: "Brian 'Kevo' Otieno",
    role: "Gold Locust",
    avatar: "/assets/cast/bashir-halaiki.png",
    text: "Tuko kwa barabara! Tonight's debate is already unhinged 🔥🇰🇪",
    time: "21:42",
    badgeColor: "#E5A93C",
  },
  {
    id: "2",
    name: "Nduta Kariuki",
    role: "Studio Moderator",
    avatar: "/assets/cast/nduta-kariuki.png",
    text: "Mics are hot! Keep comments clean or the Queen of Chaos mutes you 💀",
    time: "21:43",
    badgeColor: "#E50914",
  },
  {
    id: "3",
    name: "Kevin M.",
    role: "Swarm Pioneer",
    avatar: "/assets/cast/george-waweru.png",
    text: "Bashir is not letting Emmanuel breathe tonight lmao #ItawesaSana",
    time: "21:44",
    badgeColor: "#E5A93C",
  },
  {
    id: "4",
    name: "Dr. Omondi (London)",
    role: "Diaspora Citizen",
    avatar: "/assets/cast/jack-alita.png",
    text: "Sending love from London! Huge shoutout to Chinese on the culture analysis!",
    time: "21:45",
    isSuperchat: true,
    amount: 1000,
    badgeColor: "#E5A93C",
  },
];

type MobileTab = "chat" | "mics" | "merch";

function extractYouTubeVideoId(url: string): string {
  if (!url) return "7tkGUXetubY";
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : "7tkGUXetubY";
}

export default function LivePage() {
  const { isLive, streamTitle, viewerCount, nextStreamDate, ingestionUrl } = useBroadcast();
  const videoId = extractYouTubeVideoId(ingestionUrl);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [inputMsg, setInputMsg] = useState("");
  const [userName] = useState("Citizen #804");
  const [superchatOpen, setSuperchatOpen] = useState(false);
  const [superchatAmount, setSuperchatAmount] = useState<number>(500);
  const [superchatMsg, setSuperchatMsg] = useState("");
  const [phone, setPhone] = useState("");
  const [flashMerchOpen, setFlashMerchOpen] = useState(false);
  const [stkSent, setStkSent] = useState(false);
  const [activeReactions, setActiveReactions] = useState<{ id: number; emoji: string }[]>([]);
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");

  const flashItem = MERCH_PRODUCTS[0]; // NZIGE Hoodie

  const triggerReaction = (emoji: string) => {
    const id = Date.now();
    setActiveReactions((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setActiveReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      name: userName,
      role: "Swarm Citizen",
      avatar: "/assets/branding/locust-emblem-transparent.png",
      text: inputMsg,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMsg("");
  };

  const handleSuperchat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 9) return;

    setStkSent(true);

    try {
      await fetch("/api/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phone,
          amount: superchatAmount,
          accountReference: ACCOUNT_LIVE,
          transactionDesc: `Superchat: ${(superchatMsg || "Swarm Coffer").slice(0, 20)}`,
        }),
      });

      const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_AUTH_SECRET || "32f0a395fa82966d96a2c9ec23d7a04821dd79c133b6cc0909a1e94dc22e4eb2";
      await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify({
          action: "addDonor",
          donor: {
            name: `${userName} (+254 ${phone.slice(0, 3)}...)`,
            amountKes: superchatAmount,
            tier: superchatAmount >= 2500 ? "Gold Locust Donor" : "Swarm Citizen",
            shoutoutPinned: superchatAmount >= 1000,
          },
        }),
      });
    } catch {
      // fallback
    }

    const superMsg: ChatMessage = {
      id: Date.now().toString(),
      name: `${userName} (+254 ${phone.slice(0, 3)}...)`,
      role: superchatAmount >= 2500 ? "Gold Locust Donor" : "Swarm Citizen",
      avatar: "/assets/branding/locust-emblem-transparent.png",
      text: superchatMsg || "Fueled the Swarm Coffer!",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isSuperchat: true,
      amount: superchatAmount,
      badgeColor: "#E5A93C",
    };
    setMessages((prev) => [...prev, superMsg]);
    setStkSent(false);
    setSuperchatOpen(false);
    setSuperchatMsg("");
    setPhone("");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e2e1] flex flex-col">
      <SiteHeader isLive={isLive} />

      {/* Broadcast Sub-Ticker */}
      <div className="bg-[#111] border-b border-[#222] px-4 py-2 flex flex-wrap items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-3">
          {isLive ? (
            <span className="badge-on-air glow-red">
              <span className="pulse-dot" /> LIVE ON AIR
            </span>
          ) : (
            <span className="bg-[#222] text-[#aaa] font-mono px-2 py-0.5 uppercase text-[10px] font-bold">
              STANDBY FEED
            </span>
          )}
          <span className="text-white font-bold truncate max-w-xs sm:max-w-md">
            {isLive ? streamTitle : "Transmission Offline // Studio A Standby"}
          </span>
        </div>
        <div className="flex items-center gap-4 text-[#888]">
          {isLive ? (
            <span className="flex items-center gap-1.5 text-white">
              <Users size={13} className="text-[#E50914]" />
              <strong className="text-[#E5A93C]">{viewerCount.toLocaleString()}</strong> Swarm Watching
            </span>
          ) : (
            <span className="text-[#E5A93C] flex items-center gap-1">
              <Calendar size={13} />
              Next Drop: <strong className="text-white ml-1">{nextStreamDate}</strong>
            </span>
          )}
          <span className="text-[#E50914] font-bold hidden sm:inline">Studio A · Nairobi</span>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Player & Mic Matrix (8 cols on desktop) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* 16:9 Live Video Player Viewport */}
          <div className="relative aspect-video bg-[#000] border border-[#242424] overflow-hidden group shadow-2xl">
            {isLive ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                title={streamTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              <div className="relative w-full h-full">
                <Image
                  src="/assets/studio/homepage-hero.png"
                  alt="Studio Feed"
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover filter grayscale brightness-50"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 pointer-events-none" />

                {/* If Offline: Display Standby Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 sm:p-6 text-center z-10 bg-black/75 overflow-y-auto">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-[#181818] border border-[#333] flex items-center justify-center mb-2 sm:mb-3 shrink-0">
                    <Radio size={22} className="text-[#E5A93C] sm:hidden" />
                    <Radio size={28} className="text-[#E5A93C] hidden sm:block" />
                  </div>
                  <h2 className="font-headline text-lg sm:text-2xl md:text-3xl uppercase text-white mb-1 sm:mb-2 tracking-wider">
                    STUDIO TRANSMISSION OFFLINE
                  </h2>
                  <p className="font-sans text-xs sm:text-sm text-[#aaa] max-w-md mb-3 sm:mb-4 px-2">
                    The studio mics are resting. Next live broadcast drops on <strong className="text-white">{nextStreamDate}</strong>.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                    <Link href="/" className="btn-secondary text-[10px] sm:text-[11px] py-1.5 sm:py-2 px-3">
                      ← Home
                    </Link>
                    <Link href="/episodes" className="btn-primary glow-red text-[10px] sm:text-[11px] py-1.5 sm:py-2 px-3">
                      <Play size={11} fill="currentColor" /> Past Vault Drops
                    </Link>
                    <button
                      onClick={() => setSuperchatOpen(true)}
                      className="btn-mpesa text-[10px] sm:text-[11px] py-1.5 sm:py-2 px-3 glow-gold"
                    >
                      <Zap size={11} /> Pre-Fuel Coffer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Top Stream Telemetry Stamp */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
              <div className="flex items-center gap-2 bg-[#0e0e0e]/85 backdrop-blur-md px-2.5 py-1 border border-white/10 font-mono text-[10px] text-white">
                <span className={`w-2 h-2 rounded-full ${isLive ? "bg-[#E50914] animate-ping" : "bg-[#555]"}`} />
                <span>{isLive ? "1080P 60FPS LOSSLESS" : "STANDBY FEED"}</span>
              </div>
              <div className="bg-[#0e0e0e]/85 backdrop-blur-md px-2.5 py-1 border border-white/10 font-mono text-[10px] text-[#E5A93C]">
                GPS: -1.2921°, 36.8219°
              </div>
            </div>

            {/* Reaction Floaters */}
            {isLive && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {activeReactions.map((r) => (
                  <span
                    key={r.id}
                    className="absolute bottom-16 right-8 text-4xl animate-bounce"
                  >
                    {r.emoji}
                  </span>
                ))}
              </div>
            )}

            {/* Bottom In-Stream Quick Triggers (when live) */}
            {isLive && (
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFlashMerchOpen(true)}
                    className="bg-[#E50914] hover:bg-[#FF0033] text-white text-[10px] sm:text-[11px] font-mono font-bold uppercase px-3 py-1.5 flex items-center gap-1.5 shadow-lg transition"
                  >
                    <ShoppingBag size={13} /> Flash Merch Drop
                  </button>
                </div>

                {/* Emoji quick reaction deck */}
                <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-1 border border-white/10">
                  {["🔥", "💀", "🇰🇪", "⚡"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => triggerReaction(emoji)}
                      className="text-base sm:text-lg hover:scale-125 transition-transform px-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Only: Shure SM7B 6-Host Studio Mic Matrix */}
          <div className="hidden lg:block card p-3 sm:p-4 bg-[#141414]">
            <div className="flex items-center justify-between mb-3 border-b border-[#222] pb-2">
              <div className="flex items-center gap-2">
                <Mic size={14} className="text-[#E50914]" />
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white font-bold">
                  Dante Audio Bus // Shure SM7B Matrix
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#888]">Studio A · Master Console</span>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {CAST.map((member) => (
                <div
                  key={member.id}
                  className="bg-[#0e0e0e] border border-[#222] p-2 flex flex-col justify-between group hover:border-[#E50914]/40 transition"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[9px] text-[#E5A93C] font-bold">
                      MIC {member.micChannel.toString().padStart(2, "0")}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-[#E50914] animate-pulse" : "bg-[#555]"}`} />
                  </div>
                  <div className="relative w-10 h-10 mb-1.5 mx-auto overflow-hidden bg-[#181818]">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      sizes="40px"
                      className="object-cover object-top"
                    />
                  </div>
                  <p className="font-sans text-[11px] font-semibold text-white truncate text-center">
                    {member.alias || member.name.split(" ")[0]}
                  </p>
                  {/* VU Meter */}
                  <div className="w-full bg-[#222] h-1 mt-1 overflow-hidden">
                    <div
                      className={`h-full ${isLive ? "bg-[#E50914]" : "bg-[#444]"}`}
                      style={{ width: isLive ? `${Math.min(100, member.gainDb + 30)}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MOBILE TABS SWITCHER (lg:hidden) ── */}
        <div className="lg:hidden flex border-b border-[#242424] bg-[#111]">
          <button
            onClick={() => setMobileTab("chat")}
            className={`flex-1 py-2.5 font-mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition ${
              mobileTab === "chat"
                ? "border-[#E50914] text-white font-bold bg-[#181818]"
                : "border-transparent text-[#777]"
            }`}
          >
            <MessageSquare size={13} />
            Live Chat
          </button>
          <button
            onClick={() => setMobileTab("mics")}
            className={`flex-1 py-2.5 font-mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition ${
              mobileTab === "mics"
                ? "border-[#E50914] text-white font-bold bg-[#181818]"
                : "border-transparent text-[#777]"
            }`}
          >
            <Mic size={13} />
            Studio Mics (6)
          </button>
          <button
            onClick={() => setMobileTab("merch")}
            className={`flex-1 py-2.5 font-mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition ${
              mobileTab === "merch"
                ? "border-[#E50914] text-white font-bold bg-[#181818]"
                : "border-transparent text-[#777]"
            }`}
          >
            <ShoppingBag size={13} />
            Flash Drop
          </button>
        </div>

        {/* Mobile View: Mics Panel */}
        {mobileTab === "mics" && (
          <div className="lg:hidden card p-3 bg-[#141414]">
            <div className="flex items-center justify-between mb-3 border-b border-[#222] pb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#E5A93C] font-bold">
                Shure SM7B Dante Matrix
              </span>
              <span className="font-mono text-[9px] text-[#888]">Studio A Mics</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CAST.map((member) => (
                <div key={member.id} className="bg-[#0e0e0e] border border-[#222] p-2.5 flex items-center gap-3">
                  <div className="relative w-10 h-10 shrink-0 bg-[#181818]">
                    <Image src={member.image} alt={member.name} fill sizes="40px" className="object-cover object-top" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] text-[#E5A93C] font-bold">
                        MIC {member.micChannel.toString().padStart(2, "0")}
                      </span>
                      <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-[#E50914] animate-pulse" : "bg-[#555]"}`} />
                    </div>
                    <p className="font-sans text-[12px] font-semibold text-white truncate">
                      {member.alias || member.name.split(" ")[0]}
                    </p>
                    <div className="w-full bg-[#222] h-1 mt-1 overflow-hidden">
                      <div
                        className={`h-full ${isLive ? "bg-[#E50914]" : "bg-[#444]"}`}
                        style={{ width: isLive ? `${Math.min(100, member.gainDb + 30)}%` : "0%" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobile View: Flash Merch Panel */}
        {mobileTab === "merch" && (
          <div className="lg:hidden card p-4 bg-[#141414]">
            <div className="flex items-center justify-between mb-3 border-b border-[#222] pb-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#E50914] font-bold">
                ● Live Flash Drop Item
              </span>
              <span className="tag-stock text-[#E50914] border-[#E50914]/30">
                [ {flashItem.stockRemaining} LEFT ]
              </span>
            </div>
            <div className="flex gap-4 items-center mb-4">
              <div className="relative w-24 h-24 bg-[#0a0a0a] border border-[#222] shrink-0">
                <Image src={flashItem.image} alt={flashItem.name} fill sizes="96px" className="object-contain p-2" />
              </div>
              <div className="flex-1">
                <h4 className="font-headline text-lg uppercase text-white leading-tight mb-1">
                  {flashItem.name}
                </h4>
                <p className="font-sans text-[12px] text-[#888] mb-2">{flashItem.tagline}</p>
                <span className="font-mono text-base font-bold text-white">
                  KES {flashItem.priceKes.toLocaleString()}
                </span>
              </div>
            </div>
            <Link href="/cart" className="btn-primary w-full justify-center">
              Instant M-Pesa Checkout <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Right Column / Mobile Chat: Swarm Live Chat & M-Pesa Superchat Dock (4 cols on desktop) */}
        <div className={`lg:col-span-4 flex flex-col card bg-[#141414] h-[480px] sm:h-[550px] lg:h-[620px] ${mobileTab !== "chat" ? "hidden lg:flex" : "flex"}`}>
          {/* Chat Header */}
          <div className="p-3 border-b border-[#222] flex items-center justify-between bg-[#111]">
            <div className="flex items-center gap-2">
              <Radio size={14} className={isLive ? "text-[#E50914] animate-pulse" : "text-[#555]"} />
              <span className="font-headline text-sm sm:text-base uppercase text-white tracking-wider">
                SWARM LIVE CHAT
              </span>
            </div>
            <button
              onClick={() => setSuperchatOpen(true)}
              className="btn-mpesa text-[10px] px-2.5 py-1 flex items-center gap-1 glow-gold"
            >
              <Sparkles size={12} /> Superchat
            </button>
          </div>

          {/* Chat Stream Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 font-sans text-[13px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2.5 border transition ${
                  msg.isSuperchat
                    ? "bg-[#E5A93C]/10 border-[#E5A93C] glow-gold"
                    : "bg-[#0e0e0e] border-[#222]"
                }`}
              >
                {msg.isSuperchat && (
                  <div className="flex items-center justify-between font-mono text-[10px] font-bold text-[#E5A93C] mb-1 pb-1 border-b border-[#E5A93C]/30">
                    <span>M-PESA SUPERCHAT</span>
                    <span>KES {msg.amount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="font-mono text-[9px] uppercase px-1.5 py-0.2"
                    style={{
                      backgroundColor: (msg.badgeColor || "#555") + "20",
                      color: msg.badgeColor || "#888",
                      border: `1px solid ${msg.badgeColor || "#555"}40`,
                    }}
                  >
                    {msg.role}
                  </span>
                  <span className="font-semibold text-white truncate text-[12px]">
                    {msg.name}
                  </span>
                  <span className="font-mono text-[10px] text-[#555] ml-auto">
                    {msg.time}
                  </span>
                </div>
                <p className="text-[#ddd] leading-relaxed break-words">{msg.text}</p>
              </div>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-[#222] bg-[#111] flex gap-2">
            <input
              type="text"
              placeholder="Drop an inside joke (#ItawesaSana)..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="input-terminal flex-1 text-[12px] py-1.5"
            />
            <button
              type="submit"
              className="btn-primary px-3 py-1.5 text-[11px] shrink-0"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      </main>

      {/* ── M-PESA SUPERCHAT MODAL ── */}
      {superchatOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setSuperchatOpen(false)} />
          <div className="relative w-full max-w-md bg-[#141414] border border-[#E5A93C]/40 p-6 card glow-gold">
            <div className="flex items-center justify-between pb-3 border-b border-[#222] mb-4">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-[#E5A93C]" />
                <h3 className="font-headline text-xl uppercase text-white tracking-wider">
                  M-PESA SUPERCHAT
                </h3>
              </div>
              <button onClick={() => setSuperchatOpen(false)} className="text-[#888] hover:text-white">
                <X size={18} />
              </button>
            </div>

            {stkSent ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-[#E5A93C]/20 border border-[#E5A93C] flex items-center justify-center mx-auto mb-3 animate-pulse">
                  <Zap size={24} className="text-[#E5A93C]" />
                </div>
                <h4 className="font-headline text-lg uppercase text-white mb-1">
                  STK Push Prompt Triggered
                </h4>
                <p className="font-sans text-[13px] text-[#aaa]">
                  Please check your phone (+254 {phone}) and enter your M-Pesa PIN to complete KES {superchatAmount.toLocaleString()}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSuperchat} className="space-y-4">
                {/* Preset Chips */}
                <div>
                  <label className="font-mono text-[10px] uppercase text-[#888] block mb-2">
                    Select Amount (KES)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[200, 500, 1000, 2500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setSuperchatAmount(amt)}
                        className={`font-mono text-[12px] font-bold py-2 border transition ${
                          superchatAmount === amt
                            ? "bg-[#E5A93C] text-black border-[#E5A93C]"
                            : "bg-[#0e0e0e] text-[#aaa] border-[#333] hover:border-[#888]"
                        }`}
                      >
                        KES {amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone Number Input */}
                <div>
                  <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">
                    Safaricom Line (+254)
                  </label>
                  <div className="flex gap-0">
                    <span className="input-terminal w-16 shrink-0 text-center text-[#888] border-r-0">
                      +254
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="7XX XXX XXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      maxLength={9}
                      className="input-terminal flex-1"
                    />
                  </div>
                </div>

                {/* Shoutout Message */}
                <div>
                  <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">
                    Broadcast Shoutout Message
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Message will pin in live chat and show on studio deck..."
                    value={superchatMsg}
                    onChange={(e) => setSuperchatMsg(e.target.value)}
                    className="input-terminal w-full text-[12px]"
                  />
                </div>

                {/* Action CTA */}
                <button type="submit" className="btn-mpesa w-full justify-center">
                  Trigger M-Pesa STK (KES {superchatAmount.toLocaleString()}) →
                </button>
                <p className="font-mono text-[9px] text-[#666] text-center uppercase">
                  Direct to Paybill {PAYBILL} · Account {ACCOUNT_LIVE}
                </p>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── FLASH MERCH SLIDE-OVER DRAWER ── */}
      {flashMerchOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setFlashMerchOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#131313] border-l border-[#242424] flex flex-col p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#222] mb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#E50914] font-bold">
                ● Live Flash Drop
              </span>
              <button onClick={() => setFlashMerchOpen(false)} className="text-[#888] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="relative aspect-square bg-[#0a0a0a] border border-[#222] mb-4">
              <Image
                src={flashItem.image}
                alt={flashItem.name}
                fill
                sizes="(max-width: 640px) 100vw, 380px"
                className="object-contain p-6"
              />
              <span className="absolute top-2 left-2 tag-stock text-[#E50914] border-[#E50914]/30">
                [ {flashItem.stockRemaining} LEFT IN VAULT ]
              </span>
            </div>

            <h3 className="font-headline text-2xl uppercase text-white mb-1">
              {flashItem.name}
            </h3>
            <p className="font-sans text-[13px] text-[#888] mb-4">
              {flashItem.tagline}
            </p>

            <div className="mt-auto pt-4 border-t border-[#222] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-[#888] uppercase">Studio Price</span>
                <span className="font-mono text-xl font-bold text-white">
                  KES {flashItem.priceKes.toLocaleString()}
                </span>
              </div>
              <Link
                href="/cart"
                onClick={() => setFlashMerchOpen(false)}
                className="btn-primary w-full justify-center"
              >
                Instant Checkout <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      <MobileNav />
      <div className="h-16 md:hidden" />
    </div>
  );
}
