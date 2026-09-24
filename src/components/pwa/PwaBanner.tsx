"use client";

import { useServiceWorker } from "@/hooks/useServiceWorker";
import { Wifi, WifiOff } from "lucide-react";

export default function PwaBanner() {
  const { isInstalled, isOffline } = useServiceWorker();

  if (isOffline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#E50914] text-white px-4 py-2 flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider">
        <WifiOff size={14} />
        <span>Offline — Some features may be limited</span>
      </div>
    );
  }

  if (!isInstalled) {
    return (
      <div className="fixed bottom-20 left-0 right-0 z-40 md:hidden bg-[#141414] border-t border-[#222] px-4 py-3">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <div className="flex items-center gap-2">
            <Wifi size={16} className="text-[#E5A93C]" />
            <span className="font-mono text-[11px] text-[#aaa]">Install Nzigestan App</span>
          </div>
          <button
            onClick={() => {
              const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
              meta?.setAttribute("content", "#E50914");
              // Trigger install prompt
              interface BeforeInstallPromptEvent {
                prompt: () => void;
              }
              const installPrompt = (window as unknown as { __installPrompt?: BeforeInstallPromptEvent }).__installPrompt;
              if (installPrompt) {
                installPrompt.prompt();
              }
            }}
            className="btn-primary text-xs px-3 py-1.5"
          >
            Install
          </button>
        </div>
      </div>
    );
  }

  return null;
}
