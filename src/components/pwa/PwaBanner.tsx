"use client";

import { useState, useEffect } from "react";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { WifiOff, X, Download } from "lucide-react";
import Image from "next/image";

export default function PwaBanner() {
  const { isInstalled, isOffline, canInstall, triggerInstall } = useServiceWorker();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Check if previously dismissed or already installed
    try {
      const isDismissed = localStorage.getItem("pwa_dismissed") === "true";
      const isAlreadyInstalled = localStorage.getItem("pwa_installed") === "true";
      if (!isDismissed && !isAlreadyInstalled && !isInstalled) {
        setDismissed(false);
      }
    } catch {
      setDismissed(false);
    }
  }, [isInstalled]);

  if (isOffline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#E50914] text-white px-4 py-2 flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider">
        <WifiOff size={14} />
        <span>Offline — Some features may be limited</span>
      </div>
    );
  }

  // Hide completely once installed or dismissed
  if (isInstalled || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("pwa_dismissed", "true");
    } catch {}
  };

  const handleInstallClick = async () => {
    if (canInstall) {
      await triggerInstall();
    } else {
      // Guide iOS or other browsers
      alert("To install Nzigestan:\n1. Tap the Share button in your browser\n2. Select 'Add to Home Screen'");
    }
  };

  return (
    <div className="fixed bottom-20 left-3 right-3 z-40 md:hidden bg-[#161616]/95 backdrop-blur-md border border-[#E5A93C]/40 rounded-lg p-3 shadow-2xl animate-in fade-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-9 h-9 rounded-md overflow-hidden bg-black shrink-0 border border-[#333]">
            <Image
              src="/icons/icon-96x96.png"
              alt="Nzigestan App"
              fill
              className="object-cover"
              sizes="36px"
            />
          </div>
          <div className="min-w-0">
            <h4 className="font-headline text-xs uppercase text-white truncate font-bold tracking-wide">
              Install Nzigestan App
            </h4>
            <p className="font-mono text-[10px] text-[#888] truncate">
              Instant live alerts & offline playback
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="btn-primary text-[11px] py-1.5 px-3 flex items-center gap-1 font-bold shadow-md"
          >
            <Download size={12} /> Install
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Close install banner"
            className="p-1.5 text-[#666] hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
