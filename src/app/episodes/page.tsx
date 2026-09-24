"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import MobileNav from "@/components/layout/MobileNav";
import { Search, Play, Clock, Eye } from "lucide-react";

const FREQUENCIES = [
  { id: "all", label: "#All", color: "#888" },
  { id: "blissful-banter", label: "#BlissfulBanter", color: "#E50914" },
  { id: "comic-diaries", label: "#ComicDiaries", color: "#E5A93C" },
  { id: "deep-dives", label: "#DeepDives", color: "#e5e2e1" },
  { id: "republic-archives", label: "#12HourLive", color: "#555" },
];

import { useAppData } from "@/context/AppDataContext";

function formatViews(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
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
  "deep-dives": "#aaa",
  "republic-archives": "#555",
};

export default function EpisodesPage() {
  const { episodes } = useAppData();
  const [activeFreq, setActiveFreq] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = episodes.filter((ep) => {
    const matchFreq = activeFreq === "all" || ep.frequency === activeFreq;
    const matchQuery =
      query === "" ||
      ep.title.toLowerCase().includes(query.toLowerCase()) ||
      ep.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
    return matchFreq && matchQuery;
  });

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1]">
      <SiteHeader />

      {/* Hero */}
      <div className="bg-[#0a0a0a] border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#E50914] mb-2">
            — Content Vault & Archive
          </p>
          <h1 className="font-headline text-5xl sm:text-6xl uppercase text-white mb-2">
            EPISODE VAULT
          </h1>
          <p className="font-sans text-[#888] text-sm max-w-xl mb-6">
            Full archive of The Kisiangani Podcast — synced live from{" "}
            <a href="https://www.youtube.com/@thekisianganipodcast/" target="_blank" rel="noopener noreferrer"
              className="text-[#E50914] hover:underline">
              @thekisianganipodcast
            </a>
            . Filter by frequency, search by episode, or browse by tag.
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" />
            <input
              type="text"
              placeholder="Search episodes, tags, topics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-terminal w-full pl-10"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Frequency filter tabs */}
        <div className="flex flex-wrap gap-2 mb-10 overflow-x-auto pb-2 no-scrollbar">
          {FREQUENCIES.map((freq) => (
            <button
              key={freq.id}
              onClick={() => setActiveFreq(freq.id)}
              className={`font-mono text-[11px] uppercase tracking-[0.1em] px-4 py-2 border shrink-0 transition-colors ${
                activeFreq === freq.id
                  ? "bg-[#E50914] text-white border-[#E50914]"
                  : "bg-transparent text-[#888] border-[#333] hover:border-[#555] hover:text-white"
              }`}
            >
              {freq.label}
            </button>
          ))}
        </div>

        {/* Episodes grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-mono text-[11px] text-[#555] uppercase tracking-[0.15em]">
              No episodes found · Try a different search
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((ep) => (
              <Link key={ep.id} href={`/episodes/${ep.id}`} className="card group block">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-[#0a0a0a] overflow-hidden">
                  <Image
                    src={ep.thumbnail || `https://i.ytimg.com/vi/${ep.youtubeId}/maxresdefault.jpg`}
                    alt={ep.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 bg-[#E50914] flex items-center justify-center glow-red">
                      <Play size={20} className="text-white ml-1" fill="white" />
                    </div>
                  </div>
                  {/* Duration */}
                  <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5">
                    <span className="font-mono text-[10px] text-white">{ep.duration}</span>
                  </div>
                  {/* Freq badge */}
                  <div className="absolute top-2 left-2">
                    <span
                      className="font-mono text-[9px] uppercase tracking-[0.08em] px-2 py-0.5"
                      style={{ backgroundColor: FREQ_COLORS[ep.frequency] + "20", color: FREQ_COLORS[ep.frequency], border: `1px solid ${FREQ_COLORS[ep.frequency]}30` }}
                    >
                      {FREQ_LABELS[ep.frequency]}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-sans text-[13px] font-semibold text-white leading-tight mb-2 group-hover:text-[#E50914] transition-colors line-clamp-2">
                    {ep.title}
                  </h3>
                  <div className="flex items-center gap-4 text-[#666] mb-3">
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Eye size={10} /> {formatViews(ep.viewCount)}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Clock size={10} /> {ep.duration}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ep.tags.map((tag) => (
                      <span key={tag} className="font-mono text-[9px] text-[#555] uppercase tracking-[0.06em] bg-white/3 border border-[#222] px-1.5 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Sync note */}
        <div className="mt-10 border border-[#222] bg-[#131313] p-4 flex items-center justify-between">
          <p className="font-mono text-[10px] text-[#555] uppercase tracking-[0.1em]">
            Episodes auto-synced from @thekisianganipodcast via YouTube Data API v3
          </p>
          <span className="font-mono text-[10px] text-[#E5A93C] uppercase tracking-[0.1em]">
            Last sync: Live
          </span>
        </div>
      </div>

      <MobileNav />
      <div className="h-16 md:hidden" />
    </div>
  );
}
