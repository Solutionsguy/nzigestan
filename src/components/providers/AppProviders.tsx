"use client";

import React from "react";
import { BroadcastProvider } from "@/context/BroadcastContext";
import { AppDataProvider } from "@/context/AppDataContext";
import PwaBanner from "@/components/pwa/PwaBanner";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BroadcastProvider>
        <AppDataProvider>{children}</AppDataProvider>
      </BroadcastProvider>
      <PwaBanner />
    </>
  );
}
