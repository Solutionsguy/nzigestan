"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface BroadcastContextType {
  isLive: boolean;
  setIsLive: (live: boolean) => void;
  toggleLive: () => void;
  streamTitle: string;
  setStreamTitle: (title: string) => void;
  viewerCount: number;
  nextStreamDate: string;
  setNextStreamDate: (date: string) => void;
  ingestionUrl: string;
  setIngestionUrl: (url: string) => void;
  syncWithServer: () => Promise<void>;
}

const BroadcastContext = createContext<BroadcastContextType | undefined>(undefined);

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_AUTH_SECRET || "32f0a395fa82966d96a2c9ec23d7a04821dd79c133b6cc0909a1e94dc22e4eb2";

export function BroadcastProvider({ children }: { children: React.ReactNode }) {
  const [isLive, setIsLiveState] = useState<boolean>(false);
  const [streamTitle, setStreamTitleState] = useState<string>("AMAN on a Mission - Kitengela Only // Live Broadcast");
  const [viewerCount, setViewerCount] = useState<number>(14280);
  const [nextStreamDate, setNextStreamDateState] = useState<string>("Friday 9:00 PM EAT");
  const [ingestionUrl, setIngestionUrlState] = useState<string>("https://www.youtube.com/watch?v=7tkGUXetubY");

  // Fetch broadcast status from central server API (shared across all LAN devices)
  const syncWithServer = useCallback(async () => {
    try {
      const res = await fetch("/api/broadcast/status", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.isLive === "boolean") setIsLiveState(data.isLive);
        if (data.streamTitle) setStreamTitleState(data.streamTitle);
        if (typeof data.viewerCount === "number") setViewerCount(data.viewerCount);
        if (data.nextStreamDate) setNextStreamDateState(data.nextStreamDate);
        if (data.ingestionUrl) setIngestionUrlState(data.ingestionUrl);
      }
    } catch {
      // Offline fallback
    }
  }, []);

  // Sync on initial mount
  useEffect(() => {
    syncWithServer();
  }, [syncWithServer]);

  // SSE subscription — primary real-time channel
  useEffect(() => {
    if (typeof EventSource === "undefined") return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    const RECONNECT_DELAY = 3000;

    const connect = () => {
      eventSource = new EventSource("/api/broadcast/stream");

      eventSource.addEventListener("broadcast", (e: MessageEvent) => {
        const data = JSON.parse(e.data) as import("@/lib/serverStore").ServerStore["broadcast"];
        if (typeof data.isLive === "boolean") setIsLiveState(data.isLive);
        if (data.streamTitle) setStreamTitleState(data.streamTitle);
        if (typeof data.viewerCount === "number") setViewerCount(data.viewerCount);
        if (data.nextStreamDate) setNextStreamDateState(data.nextStreamDate);
        if (data.ingestionUrl) setIngestionUrlState(data.ingestionUrl);
      });

      eventSource.addEventListener("config", () => {});
      eventSource.addEventListener("tickerTerms", () => {});
      eventSource.addEventListener("episodes", () => {});
      eventSource.addEventListener("merch", () => {});
      eventSource.addEventListener("events", () => {});

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        // Fall back to polling
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
      };

      eventSource.onopen = () => {};
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      eventSource?.close();
    };
  }, []);

  // Polling heartbeat (runs every 2.5s) to guarantee mobile browsers get live state updates immediately
  useEffect(() => {
    const interval = setInterval(syncWithServer, 2500);

    const handleVisibilityOrFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        syncWithServer();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, [syncWithServer]);

  // Update server state and broadcast to all devices
  const updateServer = async (updates: Record<string, unknown>) => {
    try {
      await fetch("/api/broadcast/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify(updates),
      });
    } catch {
      // server update fallback
    }
  };

  const setIsLive = (live: boolean) => {
    setIsLiveState(live);
    updateServer({ isLive: live });
  };

  const setStreamTitle = (title: string) => {
    setStreamTitleState(title);
    updateServer({ streamTitle: title });
  };

  const setNextStreamDate = (date: string) => {
    setNextStreamDateState(date);
    updateServer({ nextStreamDate: date });
  };

  const setIngestionUrl = (url: string) => {
    setIngestionUrlState(url);
    updateServer({ ingestionUrl: url });
  };

  const toggleLive = () => {
    const next = !isLive;
    setIsLiveState(next);
    updateServer({ isLive: next });
  };

  return (
    <BroadcastContext.Provider
      value={{
        isLive,
        setIsLive,
        toggleLive,
        streamTitle,
        setStreamTitle,
        viewerCount,
        nextStreamDate,
        setNextStreamDate,
        ingestionUrl,
        setIngestionUrl,
        syncWithServer,
      }}
    >
      {children}
    </BroadcastContext.Provider>
  );
}

export function useBroadcast() {
  const context = useContext(BroadcastContext);
  if (!context) {
    throw new Error("useBroadcast must be used within a BroadcastProvider");
  }
  return context;
}
