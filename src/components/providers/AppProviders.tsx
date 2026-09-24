"use client";

import React from "react";
import { BroadcastProvider } from "@/context/BroadcastContext";
import { AppDataProvider } from "@/context/AppDataContext";
import { CartProvider } from "@/context/CartContext";
import PwaBanner from "@/components/pwa/PwaBanner";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BroadcastProvider>
        <AppDataProvider>
          <CartProvider>{children}</CartProvider>
        </AppDataProvider>
      </BroadcastProvider>
      <PwaBanner />
    </>
  );
}
