"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Radio, Zap } from "lucide-react";
import { useBroadcast } from "@/context/BroadcastContext";

const NAV_LINKS = [
  { href: "/episodes", label: "Episodes" },
  { href: "/tours", label: "Tours & Hikes" },
  { href: "/merch", label: "Merch" },
  { href: "/#coffer", label: "Coffer" },
  { href: "/#hive", label: "The Hive" },
];

interface SiteHeaderProps {
  isLive?: boolean;
  nextStreamDate?: string;
  cartCount?: number;
}

export default function SiteHeader({
  isLive: propIsLive,
  nextStreamDate: propNextStreamDate,
  cartCount = 0,
}: SiteHeaderProps) {
  const broadcast = useBroadcast();
  const isLive = propIsLive !== undefined ? propIsLive : broadcast.isLive;
  const nextStreamDate = propNextStreamDate !== undefined ? propNextStreamDate : broadcast.nextStreamDate;

  return (
    <>
      {/* Schedule / Status Ticker Bar */}
      <aside className="bg-[#0a0a0a] border-b border-[#222] py-2 px-4 text-[11px] font-mono tracking-wider relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full inline-block ${isLive ? "bg-[#E50914] animate-pulse" : "bg-[#555]"}`}
            />
            <span className="text-[#888]">
              Republic of Nzigestan •{" "}
              <span className={isLive ? "text-[#E50914] font-bold" : "text-[#ccc]"}>
                {isLive ? "LIVE ON AIR" : "Broadcast Offline"}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            {!isLive && (
              <span className="text-[#E5A93C] flex items-center gap-1.5 font-medium text-[10px] sm:text-[11px]">
                <Radio size={12} />
                Next Stream:{" "}
                <span className="text-white font-semibold ml-1">{nextStreamDate}</span>
              </span>
            )}
            <Link
              href="/episodes"
              className="hidden sm:inline-flex items-center gap-1 text-[#888] hover:text-white transition text-[11px]"
            >
              Watch Past Drops →
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-[#0e0e0e]/95 backdrop-blur-md border-b border-[#242424]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">

          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
              <Image
                src="/assets/branding/locust-emblem-hq-transparent.png"
                alt="Nzigestan Locust Emblem"
                width={44}
                height={44}
                className="object-contain drop-shadow"
              />
            </div>
            <div>
              <span className="font-headline tracking-[0.2em] text-lg sm:text-xl block leading-none text-white group-hover:text-[#E50914] transition-colors uppercase">
                KISIANGANI
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.22em] uppercase text-[#888] font-medium block mt-1">
                THE REPUBLIC OF NZIGESTAN
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 text-[11px] font-mono font-semibold uppercase tracking-[0.15em] text-[#aaa]">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-white transition hover:border-b border-[#E50914] py-1"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isLive ? (
              <Link href="/live" className="badge-on-air glow-red animate-pulse">
                <span className="pulse-dot" />
                ON AIR
              </Link>
            ) : (
              <Link href="/#coffer" className="btn-secondary px-3 py-1.5 text-[11px] flex items-center gap-1.5 text-[#E5A93C] border-[#E5A93C]/30 hover:border-[#E5A93C]">
                <Zap size={12} />
                <span>Support</span>
              </Link>
            )}
            <Link href="/merch" className="relative">
              <button className="btn-secondary px-3 py-2 flex items-center gap-2">
                <ShoppingBag size={14} />
                <span>Merch</span>
                {cartCount > 0 && (
                  <span className="bg-[#E50914] text-white text-[10px] font-mono font-bold px-1.5 py-0.5 ml-1">
                    {cartCount}
                  </span>
                )}
              </button>
            </Link>
          </div>

          {/* Mobile Right Action (No redundant sandwich menu, perfectly complementing MobileNav) */}
          <div className="flex md:hidden items-center gap-2">
            {isLive ? (
              <Link
                href="/live"
                className="badge-on-air glow-red text-[9px] px-2.5 py-1 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                LIVE NOW
              </Link>
            ) : (
              <Link
                href="/#coffer"
                className="bg-[#181818] border border-[#333] text-[#E5A93C] font-mono text-[10px] font-bold uppercase px-2.5 py-1.5 flex items-center gap-1"
              >
                <Zap size={11} />
                Support
              </Link>
            )}
            <Link href="/cart" className="relative p-2 text-[#aaa] hover:text-white">
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#E50914] text-white text-[8px] font-bold font-mono px-1">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

        </div>
      </header>
    </>
  );
}
