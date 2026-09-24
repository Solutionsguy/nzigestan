"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import MobileNav from "@/components/layout/MobileNav";
import { CAST, PAYBILL, ACCOUNT_LIVE } from "@/lib/constants";
import { useAppData } from "@/context/AppDataContext";
import type { Episode } from "@/types";
import {
  Play,
  Clock,
  Eye,
  Calendar,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  Share2,
  Check,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

const FREQ_LABELS: Record<string, string> = {
  "blissful-banter": "Freq 01: Blissful Banter",
  "comic-diaries": "Freq 02: Comic Diaries",
  "deep-dives": "Freq 03: Deep Dives",
  "republic-archives": "Freq 04: Republic Archives",
};

const FREQ_COLORS: Record<string, string> = {
  "blissful-banter": "#E50914",
  "comic-diaries": "#E5A93C",
  "deep-dives": "#888888",
  "republic-archives": "#e5e2e1",
};

function formatViews(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function EpisodeDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const epId = resolvedParams.id;
  const { episodes } = useAppData();
  const [isPlaying, setIsPlaying] = useState(true);
  const [copied, setCopied] = useState(false);

  // Find the matching episode or fallback to first
  const episode: Episode =
    episodes.find((e) => e.id === epId || e.youtubeId === epId) ||
    episodes[0] || {
      id: epId,
      youtubeId: epId.length === 11 ? epId : "7tkGUXetubY",
      title: "The Kisiangani Podcast Episode",
      thumbnail: `https://i.ytimg.com/vi/${epId}/maxresdefault.jpg`,
      duration: "2:30:00",
      viewCount: 35000,
      publishedAt: new Date().toISOString(),
      frequency: "blissful-banter",
      tags: ["#TukoKwaBarabara", "#TheKisianganiPodcast"],
    };

  const otherEpisodes = episodes.filter((e) => e.id !== episode.id && e.youtubeId !== episode.youtubeId).slice(0, 4);

  const copyShareLink = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedDate = new Date(episode.publishedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1]">
      <SiteHeader />

      {/* Breadcrumb Navigation */}
      <div className="bg-[#0a0a0a] border-b border-[#222] py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link
            href="/episodes"
            className="inline-flex items-center gap-2 font-mono text-[11px] text-[#888] hover:text-white uppercase tracking-wider transition-colors"
          >
            <ArrowLeft size={13} /> Back to Episode Vault
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={copyShareLink}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] text-[#888] hover:text-[#E5A93C] uppercase tracking-wider transition-colors"
            >
              {copied ? <Check size={12} className="text-green-400" /> : <Share2 size={12} />}
              {copied ? "Link Copied!" : "Share Drop"}
            </button>
            <a
              href={`https://www.youtube.com/watch?v=${episode.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[10px] text-[#E50914] hover:underline uppercase tracking-wider"
            >
              Watch on YouTube <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Video & Content (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 16:9 Interactive Video Player Viewport */}
            <div className="relative aspect-video bg-[#000] border border-[#242424] overflow-hidden shadow-2xl">
              {isPlaying ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${episode.youtubeId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
                  title={episode.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <div
                  onClick={() => setIsPlaying(true)}
                  className="relative w-full h-full cursor-pointer group"
                >
                  <Image
                    src={episode.thumbnail || `https://i.ytimg.com/vi/${episode.youtubeId}/maxresdefault.jpg`}
                    alt={episode.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    priority
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 bg-[#E50914] flex items-center justify-center glow-red group-hover:scale-110 transition-transform">
                      <Play size={28} className="text-white ml-1" fill="white" />
                    </div>
                  </div>
                </div>
              )}
              <div className="absolute top-3 left-3 bg-[#0a0a0a]/90 px-2 py-0.5 font-mono text-[9px] text-[#E5A93C] uppercase tracking-widest border border-white/10 pointer-events-none">
                STUDIO A MASTER REPLAY
              </div>
            </div>

            {/* Episode Title & Meta */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.1em] px-2.5 py-0.5"
                  style={{
                    backgroundColor: `${FREQ_COLORS[episode.frequency] || "#E50914"}20`,
                    color: FREQ_COLORS[episode.frequency] || "#E50914",
                    border: `1px solid ${FREQ_COLORS[episode.frequency] || "#E50914"}40`,
                  }}
                >
                  {FREQ_LABELS[episode.frequency] || "Episode"}
                </span>
                <span className="font-mono text-[10px] text-[#666]">
                  ID: {episode.youtubeId}
                </span>
              </div>
              <h1 className="font-headline text-2xl sm:text-4xl uppercase text-white leading-tight mb-3">
                {episode.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-[#888] font-mono text-[11px] pb-4 border-b border-[#222]">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#E5A93C]" /> {formattedDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-[#E5A93C]" /> {episode.duration}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye size={13} className="text-[#E5A93C]" /> {formatViews(episode.viewCount)} Citizens Watched
                </span>
              </div>
            </div>

            {/* Episode Description & Notes */}
            <div className="card p-6 space-y-4 font-sans text-sm text-[#bbb] leading-relaxed">
              <h3 className="font-headline text-lg uppercase text-white">
                Show Notes &amp; Vernacular Telemetry
              </h3>
              <p>
                Join Emmanuel Kisiangani and the Nzigestan studio crew for deep dives, unfiltered Nairobi discourse, and raw laughs on this physical odyssey.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {episode.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[10px] uppercase bg-white/5 border border-white/10 px-2.5 py-1 text-[#aaa]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: More Episodes, Cast & Swarm Coffer (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* More Episodes from the Vault */}
            {otherEpisodes.length > 0 && (
              <div className="card p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#222]">
                  <h3 className="font-mono text-[11px] uppercase tracking-widest text-[#888]">
                    More From The Vault
                  </h3>
                  <Link href="/episodes" className="font-mono text-[10px] text-[#E50914] uppercase hover:underline">
                    View All
                  </Link>
                </div>
                <div className="space-y-3">
                  {otherEpisodes.map((ep) => (
                    <Link
                      key={ep.id}
                      href={`/episodes/${ep.id}`}
                      className="flex gap-3 group items-center hover:bg-white/5 p-1.5 rounded transition-colors"
                    >
                      <div className="relative w-24 aspect-video bg-[#0a0a0a] shrink-0 overflow-hidden">
                        <Image
                          src={ep.thumbnail || `https://i.ytimg.com/vi/${ep.youtubeId}/mqdefault.jpg`}
                          alt={ep.title}
                          fill
                          sizes="96px"
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-sans text-[12px] font-semibold text-white leading-tight truncate group-hover:text-[#E50914] transition-colors">
                          {ep.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#666]">
                          <span>{ep.duration}</span>
                          <span>·</span>
                          <span>{formatViews(ep.viewCount)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Hosts mic'd up on this episode */}
            <div className="card p-4">
              <h3 className="font-mono text-[11px] uppercase tracking-widest text-[#888] mb-3">
                Mic&apos;d Up In Studio
              </h3>
              <div className="space-y-3">
                {CAST.slice(0, 4).map((member) => (
                  <div key={member.id} className="flex items-center gap-3 bg-[#0a0a0a] p-2 border border-[#222]">
                    <div className="relative w-10 h-10 shrink-0 bg-[#181818]">
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        sizes="40px"
                        className="object-cover object-top"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-[12px] font-semibold text-white truncate">
                        {member.name}
                      </p>
                      <p className="font-mono text-[9px] text-[#E5A93C] uppercase">
                        {member.role.split("·")[0]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* In-Episode Superchat / Coffer Dock */}
            <div className="card p-6 glow-gold border-[#E5A93C]/30 space-y-4">
              <div className="flex items-center gap-2 text-[#E5A93C]">
                <Sparkles size={16} />
                <h3 className="font-headline text-lg uppercase text-white">
                  FUEL THIS EPISODE
                </h3>
              </div>
              <p className="font-sans text-[12px] text-[#888] leading-relaxed">
                Appreciate this discourse? Drop a direct tip via M-Pesa to support Studio A.
              </p>
              <div className="bg-[#0a0a0a] p-3 border border-[#222] font-mono text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#666]">Paybill:</span>
                  <span className="text-[#E5A93C] font-bold">{PAYBILL}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Account:</span>
                  <span className="text-white">{ACCOUNT_LIVE}</span>
                </div>
              </div>
              <Link href="/live" className="btn-mpesa w-full justify-center text-xs">
                Send Superchat / Tip →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <MobileNav />
      <div className="h-16 md:hidden" />
    </div>
  );
}
