"use client";

import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import MobileNav from "@/components/layout/MobileNav";
import { CAST, TICKER_TERMS, EVENTS } from "@/lib/constants";
import { ArrowRight, Copy, Tv, Calendar, MapPin, Users, Zap, Play } from "lucide-react";
import { useBroadcast } from "@/context/BroadcastContext";
import { useAppData } from "@/context/AppDataContext";
import { useState } from "react";

export default function HomePage() {
  const { isLive, streamTitle, viewerCount } = useBroadcast();
  const { episodes, merch, events, tickerTerms, config } = useAppData();
  const [copied, setCopied] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const displayTickerTerms = tickerTerms && tickerTerms.length > 0 ? tickerTerms : TICKER_TERMS;
  const displayEvents = events && events.length > 0 ? events : EVENTS;
  const featuredMerch = (merch || []).slice(0, 4);
  const upcomingEvent = displayEvents.find((e) => e.status === "on-sale") || displayEvents[0];

  // Dynamically resolve hero header photo (Admin choice: Latest video thumbnail vs Custom upload/URL)
  const latestEpisodeThumbnail = episodes && episodes.length > 0 ? episodes[0].thumbnail : "/assets/studio/homepage-hero.png";
  const heroBackgroundImage = config.heroImageMode === "latest-episode"
    ? latestEpisodeThumbnail
    : (config.heroCustomImage || "/assets/studio/homepage-hero.png");

  const copyPaybill = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(config.paybill);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1]">
      <SiteHeader />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden">
        {/* Background hero image */}
        <div className="absolute inset-0">
          <Image
            src={heroBackgroundImage}
            alt="The Kisiangani Podcast Studio"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center filter brightness-90"
            unoptimized={heroBackgroundImage.startsWith("http") || heroBackgroundImage.startsWith("data:")}
          />
          {/* Radial vignette into obsidian */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0e0e0e]/70 via-[#0e0e0e]/40 to-[#0e0e0e]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e0e]/90 via-transparent to-[#0e0e0e]/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28">
          {/* Broadcast Status Indicator */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isLive ? "bg-[#E50914] animate-pulse" : "bg-[#555]"}`} />
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">
                {isLive ? "STUDIO A · ON AIR" : "STUDIO A · STANDBY"}
              </span>
            </div>
          </div>

          {/* If Live: Featured Live Transmission Card right in hero */}
          {isLive ? (
            <div className="max-w-3xl mb-8">
              <h1 className="font-headline text-4xl sm:text-6xl lg:text-7xl leading-none uppercase tracking-tight text-white mb-3 text-glow-red">
                NOW BROADCASTING LIVE
              </h1>
              <p className="font-mono text-[12px] sm:text-[13px] uppercase tracking-[0.2em] text-[#E5A93C] mb-4">
                {streamTitle}
              </p>
              <p className="font-sans text-sm sm:text-base text-[#ccc] max-w-xl mb-6 leading-relaxed">
                Emmanuel Kisiangani, Bashir Halaiki &amp; the Laf Lyf crew are hot on the mics in Studio A. Join the live stream, drop superchats, and react in real-time.
              </p>

              {/* Interactive Live Card Preview */}
              <div className="card p-3 sm:p-4 bg-[#141414]/90 border border-[#E50914]/40 glow-red mb-6 max-w-xl">
                <div className="flex items-center justify-between gap-2 mb-3 font-mono text-[10px] uppercase">
                  <span className="flex items-center gap-1.5 text-white font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />
                    1080P 60FPS LOSSLESS
                  </span>
                  <span className="text-[#E5A93C] font-semibold flex items-center gap-1">
                    <Users size={12} className="text-[#E50914]" />
                    {viewerCount.toLocaleString()} Swarm Watching
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <Link href="/live" className="btn-primary glow-red flex-1 justify-center py-3 text-[12px]">
                    <Play size={14} fill="currentColor" /> Enter Live Studio Room
                  </Link>
                  <button
                    onClick={copyPaybill}
                    className="btn-secondary px-3 text-[11px] flex items-center gap-1.5 text-[#E5A93C] border-[#E5A93C]/30 hover:border-[#E5A93C]"
                  >
                    <Zap size={13} />
                    {copied ? "Paybill 522522 Copied!" : "Paybill 522522"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Main headline when Offline */}
              <h1 className="font-headline text-[52px] sm:text-[72px] lg:text-[96px] leading-none uppercase tracking-tight text-white mb-4 text-glow-red">
                KISIANGANI
              </h1>
              <p className="font-mono text-[12px] sm:text-[13px] uppercase tracking-[0.25em] text-[#E5A93C] mb-6">
                TUKO KWA BARABARA ON THIS PHYSICAL ODYSSEY
              </p>
              <p className="font-sans text-base sm:text-lg text-[#aaa] max-w-xl mb-10 leading-relaxed">
                Kenya&apos;s #1 underground comedy, culture &amp; philosophical odyssey.
                Live streams, episodes, community hikes, and the official merch drop —
                all from Studio A, Nairobi.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <Link href="/episodes" className="btn-primary glow-red">
                  Cheki Latest Drop
                  <ArrowRight size={14} />
                </Link>
                <Link href="/merch" className="btn-secondary">
                  Join the Swarm (Merch)
                </Link>
              </div>
            </>
          )}

          {/* Vernacular ticker badges */}
          <div className="flex flex-wrap gap-2 mt-8">
            {["#TukoKwaBarabara", "#ItawesaSana", "#KuingiaMtaro", "#YouGuy", "#HiiNiLafLyf"].map((tag) => (
              <span
                key={tag}
                className="font-mono text-[10px] uppercase tracking-[0.1em] bg-white/5 border border-white/10 px-3 py-1 text-[#888]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── BROADCAST TICKER ─────────────────────────────── */}
      <div className="bg-[#0a0a0a] border-y border-[#222] py-2.5 overflow-hidden">
        <div className="ticker-animate font-mono text-[11px] tracking-[0.15em] text-[#555] uppercase">
          {[...displayTickerTerms, ...displayTickerTerms].map((term, i) => (
            <span key={i} className="mr-12">
              {term}
            </span>
          ))}
        </div>
      </div>

      {/* ── SEGMENT FREQUENCIES ──────────────────────────── */}
      <section id="episodes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#E50914] mb-2">
              — Content Vault
            </p>
            <h2 className="font-headline text-3xl sm:text-5xl uppercase text-white">
              EPISODE FREQUENCIES
            </h2>
          </div>
          <Link href="/episodes" className="hidden sm:flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#888] hover:text-white transition">
            All Episodes <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { freq: "01", title: "Blissful Banter", desc: "Rapid-fire host clashes & high-voltage studio debates", tag: "blissful-banter", color: "#E50914" },
            { freq: "02", title: "Comic Diaries & Laf Lyf", desc: "Raw stand-up backstage stories, crew riffs & antics", tag: "comic-diaries", color: "#E5A93C" },
            { freq: "03", title: "Chopping It Up & Deep Dives", desc: "Existential philosophy, psychology & long-form discourse", tag: "deep-dives", color: "#888" },
            { freq: "04", title: "Republic Archives", desc: "12-hour marathon specials & live crowd recordings", tag: "republic-archives", color: "#e5e2e1" },
          ].map((freq) => (
            <Link
              key={freq.freq}
              href={`/episodes?freq=${freq.tag}`}
              className="card group p-6 hover:border-[#333] transition-colors cursor-pointer block"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] mb-3" style={{ color: freq.color }}>
                FREQ {freq.freq}
              </p>
              <h3 className="font-headline text-xl uppercase text-white mb-2 group-hover:text-[#E50914] transition-colors">
                {freq.title}
              </h3>
              <p className="font-sans text-[13px] text-[#666] leading-relaxed">
                {freq.desc}
              </p>
              <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#444] group-hover:text-[#888] transition-colors">
                Browse Episodes <ArrowRight size={10} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── MERCH PREVIEW ────────────────────────────────── */}
      <section id="merch" className="bg-[#131313] border-y border-[#222] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#E5A93C] mb-2">
                — Season 01 Drop
              </p>
              <h2 className="font-headline text-3xl sm:text-5xl uppercase text-white">
                STREETWEAR VAULT
              </h2>
            </div>
            <Link href="/merch" className="hidden sm:flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#888] hover:text-white transition">
              Full Catalog <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredMerch.map((product) => {
              const pctLeft = Math.round((product.stockRemaining / product.stockTotal) * 100);
              const isCritical = product.stockRemaining < 15;

              return (
                <Link key={product.id} href="/merch" className="card group block">
                  {/* Product image area */}
                  <div className="relative aspect-square bg-[#0a0a0a] overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px"
                      className="object-contain p-6 group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Stock tag */}
                    <div className="absolute top-2 left-2">
                      <span className={`tag-stock ${isCritical ? "text-[#E50914] border-[#E50914]/30" : ""}`}>
                        [ {product.stockRemaining} / {product.stockTotal} LEFT ]
                      </span>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-sans text-[13px] font-semibold text-[#e5e2e1] leading-tight mb-1 group-hover:text-white transition-colors">
                      {product.name}
                    </h3>
                    <p className="font-mono text-[11px] text-[#888] mb-3">
                      {product.tagline.slice(0, 40)}...
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-white">
                        KES {product.priceKes.toLocaleString()}
                      </span>
                      {isCritical && (
                        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#E50914]">
                          Almost gone
                        </span>
                      )}
                    </div>
                    {/* Stock bar */}
                    <div className="mt-2 h-[2px] bg-[#222]">
                      <div
                        className={`h-full ${isCritical ? "bg-[#E50914]" : "bg-[#E5A93C]"}`}
                        style={{ width: `${pctLeft}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Link href="/merch" className="btn-primary inline-flex glow-gold" style={{ backgroundColor: "#E5A93C", color: "#0a0a0a" }}>
              Shop Full Season 01 Drop <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── UPCOMING EVENTS ──────────────────────────────── */}
      {upcomingEvent && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="mb-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#E50914] mb-2">
              — Physical Sector Broadcast
            </p>
            <h2 className="font-headline text-3xl sm:text-5xl uppercase text-white">
              TOURS & HIKES
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Featured event */}
            <div className="card relative overflow-hidden">
              <div className="relative h-64">
                <Image
                  src={upcomingEvent.coverImage}
                  alt={upcomingEvent.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] bg-[#E50914] text-white px-2 py-1">
                    {upcomingEvent.category === "swarm-nature-hike" ? "Swarm Hike" : upcomingEvent.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-headline text-2xl uppercase text-white mb-1">{upcomingEvent.title}</h3>
                <p className="font-sans text-[13px] text-[#888] mb-4">{upcomingEvent.subtitle}</p>
                <div className="flex flex-col gap-2 mb-5">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#aaa]">
                    <MapPin size={12} className="text-[#E5A93C]" />
                    {upcomingEvent.venue}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#aaa]">
                    <Calendar size={12} className="text-[#E5A93C]" />
                    {new Date(upcomingEvent.date).toDateString()} · {upcomingEvent.time}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#aaa]">
                    <Users size={12} className="text-[#E5A93C]" />
                    {upcomingEvent.capacityBooked} / {upcomingEvent.capacityTotal} Booked
                    ({Math.round((upcomingEvent.capacityBooked / upcomingEvent.capacityTotal) * 100)}%)
                  </div>
                </div>
                {/* Capacity bar */}
                <div className="h-[2px] bg-[#222] mb-5">
                  <div
                    className="h-full bg-[#E50914]"
                    style={{ width: `${(upcomingEvent.capacityBooked / upcomingEvent.capacityTotal) * 100}%` }}
                  />
                </div>
                <Link href="/tours" className="btn-primary w-full justify-center">
                  Book Your Pass <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* All events link CTA */}
            <div className="flex flex-col gap-4">
              {displayEvents.slice(1, 4).map((event) => (
                <Link key={event.id} href="/tours" className="card p-4 flex items-center gap-4 group hover:border-[#333] transition-colors">
                  <div className="w-12 h-12 bg-[#0a0a0a] flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-[#E5A93C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-headline text-base uppercase text-white truncate group-hover:text-[#E50914] transition-colors">
                      {event.title}
                    </h4>
                    <p className="font-mono text-[10px] text-[#666] uppercase tracking-[0.1em]">
                      {new Date(event.date).toDateString()} · {event.venue.split(",")[0]}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-[9px] uppercase tracking-[0.1em] px-2 py-1 shrink-0 ${
                      event.status === "sold-out"
                        ? "bg-[#222] text-[#555]"
                        : "bg-[#E50914]/10 text-[#E50914]"
                    }`}
                  >
                    {event.status === "sold-out" ? "Sold Out" : "On Sale"}
                  </span>
                </Link>
              ))}
              <Link href="/tours" className="btn-secondary justify-center mt-2">
                View All Gatherings <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── MEET THE CREW ────────────────────────────────── */}
      <section className="bg-[#131313] border-y border-[#222] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#E50914] mb-2">
              — Studio A · Nairobi
            </p>
            <h2 className="font-headline text-3xl sm:text-5xl uppercase text-white">
              THE CREW
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CAST.map((member) => (
              <div key={member.id} className="group text-center">
                <div className="relative w-full aspect-square mb-3 overflow-hidden bg-[#0a0a0a] border border-[#222] group-hover:border-[#E50914]/40 transition-colors">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                  {/* Mic badge */}
                  <div className="absolute top-2 right-2 bg-[#0a0a0a]/80 px-1.5 py-0.5">
                    <span className="font-mono text-[9px] text-[#E5A93C] uppercase tracking-[0.08em]">
                      MIC {member.micChannel.toString().padStart(2, "0")}
                    </span>
                  </div>
                </div>
                <h3 className="font-sans text-[13px] font-semibold text-white leading-tight">
                  {member.name}
                </h3>
                {member.alias && (
                  <p className="font-mono text-[10px] text-[#E50914] uppercase tracking-[0.08em]">
                    &quot;{member.alias}&quot;
                  </p>
                )}
                <p className="font-mono text-[10px] text-[#555] uppercase tracking-[0.06em] mt-0.5 leading-tight">
                  {member.role.split("·")[0]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SWARM COFFER (FAN FUNDING) ───────────────────── */}
      <section id="coffer" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#E5A93C] mb-2">
              — Direct Fan Funding
            </p>
            <h2 className="font-headline text-3xl sm:text-5xl uppercase text-white mb-4">
              FUEL THE SWARM COFFER
            </h2>
            <p className="font-sans text-[#888] leading-relaxed mb-6">
              Support the Republic directly. Every shilling goes straight to studio
              infrastructure, crew splits, and keeping the discourse unfiltered.
            </p>
            {/* M-Pesa Paybill block */}
            <div className="card p-6 glow-gold border-[#E5A93C]/20">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#E5A93C] mb-3">
                M-Pesa Paybill
              </p>
              <div className="flex items-end gap-6 mb-4">
                <div>
                  <p className="font-mono text-[10px] text-[#666] uppercase mb-1">Business No</p>
                  <p className="font-headline text-3xl text-[#E5A93C]">{config.paybill}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-[#666] uppercase mb-1">Account</p>
                  <p className="font-headline text-3xl text-white">{config.accountLive}</p>
                </div>
              </div>
              <button
                onClick={copyPaybill}
                className="btn-secondary flex items-center gap-2 text-[#E5A93C] border-[#E5A93C]/30 hover:bg-[#E5A93C] hover:text-[#0a0a0a] hover:border-[#E5A93C]"
              >
                <Copy size={12} />
                {copied ? "Copied Paybill Details!" : "Copy Paybill Details"}
              </button>
            </div>
          </div>

          {/* YouTube membership */}
          <div className="card p-8 text-center">
            <Tv size={40} className="text-[#E50914] mx-auto mb-4" />
            <h3 className="font-headline text-2xl uppercase text-white mb-2">
              BECOME A CHANNEL MEMBER
            </h3>
            <p className="font-sans text-[13px] text-[#888] leading-relaxed mb-6">
              Join the official YouTube channel for exclusive member-only content,
              early access, and VIP chat badges during live streams.
            </p>
            <a
              href="https://www.youtube.com/@thekisianganipodcast/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex"
            >
              Join on YouTube <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* ── THE NZIGES HIVE (Newsletter) ─────────────────── */}
      <section id="hive" className="bg-[#0a0a0a] border-t border-[#222] py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#E50914] mb-2">
            — The Nziges Hive
          </p>
          <h2 className="font-headline text-3xl sm:text-5xl uppercase text-white mb-4">
            JOIN THE REPUBLIC
          </h2>
          <p className="font-sans text-[#888] leading-relaxed mb-8 text-sm">
            Get dispatches from the Republic — live stream alerts, episode drops,
            merch pre-launches, and community expedition invitations. No spam,
            just pure Nzigestan signal.
          </p>
          {newsletterStatus === "done" ? (
            <div className="bg-[#121212] border border-[#E5A93C]/40 p-6 max-w-md mx-auto">
              <p className="font-mono text-xs uppercase tracking-widest text-[#E5A93C] mb-1">
                Citizen Enrollment Confirmed
              </p>
              <p className="font-headline text-lg uppercase text-white">
                Welcome to the Republic
              </p>
              <p className="font-mono text-[11px] text-[#888] mt-2">
                Dispatches will be delivered to {newsletterEmail}.
              </p>
            </div>
          ) : (
            <form
              className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newsletterEmail || !newsletterEmail.includes("@")) return;
                setNewsletterStatus("sending");
                try {
                  const res = await fetch("/api/newsletter/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: newsletterEmail }),
                  });
                  if (res.ok) {
                    setNewsletterStatus("done");
                  } else {
                    setNewsletterStatus("error");
                  }
                } catch {
                  // Graceful fallback for offline/client-only
                  setNewsletterStatus("done");
                }
              }}
            >
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-terminal flex-1"
              />
              <button
                type="submit"
                disabled={newsletterStatus === "sending"}
                className="btn-primary shrink-0"
              >
                {newsletterStatus === "sending" ? "Enlisting..." : "Enlist"}
              </button>
            </form>
          )}
          {newsletterStatus === "error" && (
            <p className="font-mono text-[10px] text-[#E50914] uppercase tracking-[0.1em] mt-2">
              Failed to enlist. Please try again.
            </p>
          )}
          <p className="font-mono text-[10px] text-[#444] uppercase tracking-[0.1em] mt-4">
            Citizen ID issued upon enrollment
          </p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-[#222] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/assets/branding/locust-emblem-hq-transparent.png"
                alt="Nzige"
                width={28}
                height={28}
                className="object-contain"
              />
              <span className="font-headline text-sm uppercase tracking-[0.2em] text-[#555]">
                REPUBLIC OF NZIGESTAN
              </span>
            </div>
            <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.12em] text-[#444]">
              <Link href="/episodes" className="hover:text-[#888] transition">Episodes</Link>
              <Link href="/tours" className="hover:text-[#888] transition">Tours</Link>
              <Link href="/merch" className="hover:text-[#888] transition">Merch</Link>
              <Link href="/admin" className="hover:text-[#888] transition">Admin</Link>
            </div>
            <p className="font-mono text-[10px] text-[#333] uppercase tracking-[0.1em]">
              © 2026 Laf Lyf · Studio A · Nairobi
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile bottom nav */}
      <MobileNav />
      {/* Spacer for mobile nav */}
      <div className="h-16 md:hidden" />
    </div>
  );
}
