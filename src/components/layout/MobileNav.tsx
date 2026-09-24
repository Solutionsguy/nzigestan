"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radio, Tv, Map, ShoppingBag, DollarSign } from "lucide-react";
import { useBroadcast } from "@/context/BroadcastContext";

const TABS = [
  { href: "/live",     label: "Live",     icon: Radio },
  { href: "/episodes", label: "Episodes", icon: Tv },
  { href: "/tours",    label: "Tours",    icon: Map },
  { href: "/merch",    label: "Merch",    icon: ShoppingBag },
  { href: "/#coffer",  label: "Coffer",   icon: DollarSign },
];

interface MobileNavProps {
  isLive?: boolean;
  cartCount?: number;
}

export default function MobileNav({ isLive: propIsLive, cartCount = 0 }: MobileNavProps) {
  const pathname = usePathname();
  const broadcast = useBroadcast();
  const isLive = propIsLive !== undefined ? propIsLive : broadcast.isLive;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#0e0e0e]/95 backdrop-blur-xl border-t border-[#242424] pb-safe md:hidden">
      <div className="flex items-stretch h-16">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && href !== "/#coffer" && pathname.startsWith(href + "/"));
          const isLiveTab = href === "/live";

          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-mono uppercase tracking-[0.08em] transition-colors relative
                ${isActive
                  ? "text-[#E50914] font-bold"
                  : isLiveTab && isLive
                  ? "text-[#E50914]"
                  : "text-[#666] hover:text-[#aaa]"
                }`}
            >
              <div className="relative">
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                {/* Live dot on Live tab */}
                {isLiveTab && isLive && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#E50914] rounded-full animate-pulse border border-[#0e0e0e]" />
                )}
                {/* Cart badge */}
                {label === "Merch" && cartCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#E50914] text-white text-[9px] font-bold font-mono px-1 min-w-[14px] text-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span>{label}</span>
              {isActive && (
                <span className="absolute top-0 left-0 right-0 h-[2px] bg-[#E50914]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
