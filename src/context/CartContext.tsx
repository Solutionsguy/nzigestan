"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { MerchProduct } from "@/types";

export interface CartItem {
  product: MerchProduct;
  size?: string;
  qty: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: MerchProduct, size?: string, qty?: number) => void;
  updateQty: (productId: string, size: string | undefined, delta: number) => void;
  removeFromCart: (productId: string, size?: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "nzigestan_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch {
      // LocalStorage access error
    } finally {
      setInitialized(true);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // LocalStorage save error
    }
  }, [cart, initialized]);

  const addToCart = useCallback((product: MerchProduct, size?: string, qty: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && i.size === size);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && i.size === size
            ? { ...i, qty: i.qty + qty }
            : i
        );
      }
      return [...prev, { product, size, qty }];
    });
  }, []);

  const updateQty = useCallback((productId: string, size: string | undefined, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId && i.size === size
            ? { ...i, qty: Math.max(0, i.qty + delta) }
            : i
        )
        .filter((i) => i.qty > 0)
    );
  }, []);

  const removeFromCart = useCallback((productId: string, size?: string) => {
    setCart((prev) => prev.filter((i) => !(i.product.id === productId && i.size === size)));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.product.priceKes * item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
