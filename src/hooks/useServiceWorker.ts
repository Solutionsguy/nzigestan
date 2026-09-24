"use client";

import { useEffect, useState } from "react";

export function useServiceWorker() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          });

          console.log("[PWA] Service Worker registered:", registration.scope);

          // Check if already installed
          setIsInstalled(!!registration.installing || !!registration.active);

          // Listen for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  setIsInstalled(true);
                }
              });
            }
          });
        } catch (error) {
          console.error("[PWA] Service Worker registration failed:", error);
        }
      });
    }

    // Offline detection
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    updateOnlineStatus();

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  return { isInstalled, isOffline };
}
