"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SiteHeader from "@/components/layout/SiteHeader";
import MobileNav from "@/components/layout/MobileNav";
import { useAppData } from "@/context/AppDataContext";
import type { MerchProduct } from "@/types";
import { ShoppingBag, ArrowRight, X, Plus, Minus } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "[All Items]" },
  { id: "streetwear", label: "[Streetwear]" },
  { id: "accessories", label: "[Accessories]" },
  { id: "essentials", label: "[Essentials]" },
  { id: "stickers", label: "[Stickers]" },
];

export default function MerchPage() {
  const { merch } = useAppData();
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState<{ product: MerchProduct; size?: string; qty: number }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [galleryIndex, setGalleryIndex] = useState<Record<string, number>>({});

  const filtered = activeCategory === "all"
    ? merch
    : merch.filter((p) => p.category === activeCategory);

  const cartCount = cart.reduce((a, b) => a + b.qty, 0);
  const cartTotal = cart.reduce((a, b) => a + b.product.priceKes * b.qty, 0);

  const addToCart = (product: MerchProduct) => {
    const size = selectedSizes[product.id];
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && i.size === size);
      if (existing) return prev.map((i) => i.product.id === product.id && i.size === size ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, size, qty: 1 }];
    });
    setCartOpen(true);
  };

  const updateQty = (productId: string, size: string | undefined, delta: number) => {
    setCart((prev) =>
      prev.map((i) => i.product.id === productId && i.size === size
        ? { ...i, qty: Math.max(0, i.qty + delta) }
        : i
      ).filter((i) => i.qty > 0)
    );
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1]">
      <SiteHeader cartCount={cartCount} />

      {/* Page header */}
      <div className="border-b border-[#222] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#E5A93C] mb-2">
            — Season 01 Limited Drop
          </p>
          <h1 className="font-headline text-5xl sm:text-6xl uppercase text-white mb-2">
            STREETWEAR VAULT
          </h1>
          <p className="font-sans text-[#888] text-sm max-w-xl">
            Limited-run apparel, creator essentials &amp; community stash — all stamped
            with the Republic seal. Ships Nairobi metro &amp; worldwide.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Category filter bar */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`font-mono text-[11px] uppercase tracking-[0.12em] px-4 py-2 transition-colors border ${
                activeCategory === cat.id
                  ? "bg-[#E50914] text-white border-[#E50914]"
                  : "bg-transparent text-[#888] border-[#333] hover:border-[#555] hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
          <button
            onClick={() => setCartOpen(true)}
            className="ml-auto btn-secondary flex items-center gap-2"
          >
            <ShoppingBag size={14} />
            Cart {cartCount > 0 && <span className="bg-[#E50914] text-white text-[10px] font-bold px-1.5">{cartCount}</span>}
          </button>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const pctLeft = Math.round((product.stockRemaining / product.stockTotal) * 100);
            const isCritical = product.stockRemaining < 15;
            const isSoldOut = product.stockRemaining === 0;

            return (
              <div key={product.id} className="card group flex flex-col">
                {/* Image */}
                <div className="relative aspect-square bg-[#0a0a0a] overflow-hidden">
                  {(() => {
                    const images = product.gallery && product.gallery.length > 0
                      ? product.gallery
                      : [product.image];
                    const activeIdx = galleryIndex[product.id] || 0;
                    const currentImage = images[activeIdx] || images[0];
                    const isLifestyle = currentImage.includes("male") || currentImage.includes("female") || currentImage.includes("model");

                    return (
                      <>
                        <Image
                          src={currentImage}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className={`${isLifestyle ? "object-cover" : "object-contain p-4"} group-hover:scale-105 transition-transform duration-300`}
                        />
                        {images.length > 1 && (
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                            {images.map((_, i) => (
                              <button
                                key={i}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setGalleryIndex((prev) => ({ ...prev, [product.id]: i }));
                                }}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${
                                  i === activeIdx
                                    ? "bg-[#E5A93C] scale-125"
                                    : "bg-white/40 hover:bg-white/70"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                  {/* Edition tag */}
                  <div className="absolute top-2 left-2">
                    <span className={`tag-stock ${isCritical && !isSoldOut ? "text-[#E50914] border-[#E50914]/30" : ""} ${isSoldOut ? "text-[#555]" : ""}`}>
                      {isSoldOut ? "[ ARCHIVE ]" : `[ ${product.stockRemaining} / ${product.stockTotal} LEFT ]`}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-sans text-[13px] font-semibold text-white leading-tight mb-1">
                    {product.name}
                  </h3>
                  <p className="font-mono text-[10px] text-[#666] leading-relaxed flex-1 mb-3">
                    {product.tagline}
                  </p>

                  {/* Size selector */}
                  {product.sizes && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSizes((prev) => ({ ...prev, [product.id]: size }))}
                          className={`font-mono text-[10px] uppercase px-2 py-0.5 border transition-colors ${
                            selectedSizes[product.id] === size
                              ? "bg-[#E50914] text-white border-[#E50914]"
                              : "bg-transparent text-[#888] border-[#333] hover:border-[#888]"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Price + stock bar */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold text-white">
                      KES {product.priceKes.toLocaleString()}
                    </span>
                    {isCritical && !isSoldOut && (
                      <span className="font-mono text-[9px] text-[#E50914] uppercase tracking-[0.08em]">
                        Almost gone
                      </span>
                    )}
                  </div>
                  <div className="h-[2px] bg-[#222] mb-3">
                    <div className={`h-full ${isCritical ? "bg-[#E50914]" : "bg-[#E5A93C]"}`}
                      style={{ width: `${pctLeft}%` }} />
                  </div>

                  {/* Add to cart */}
                  <button
                    onClick={() => addToCart(product)}
                    disabled={isSoldOut || (!!product.sizes && !selectedSizes[product.id])}
                    className={`w-full font-mono text-[11px] uppercase tracking-[0.1em] py-2.5 transition-all flex items-center justify-center gap-2 ${
                      isSoldOut
                        ? "bg-[#1a1a1a] text-[#444] cursor-not-allowed border border-[#222]"
                        : "btn-primary hover:glow-red"
                    }`}
                  >
                    {isSoldOut ? "Sold Out" : product.sizes && !selectedSizes[product.id] ? "Select Size" : "Add to Cart"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CART SLIDE-OVER ──────────────────────────────── */}
      {cartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-md bg-[#131313] border-l border-[#242424] flex flex-col h-full">
            {/* Cart header */}
            <div className="flex items-center justify-between p-6 border-b border-[#222]">
              <h2 className="font-headline text-xl uppercase text-white">Your Cart</h2>
              <button onClick={() => setCartOpen(false)} className="text-[#888] hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag size={40} className="text-[#333] mx-auto mb-3" />
                  <p className="font-mono text-[11px] text-[#555] uppercase tracking-[0.1em]">
                    Your cart is empty
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className="flex gap-4 card p-3">
                    <div className="w-16 h-16 bg-[#0a0a0a] relative shrink-0">
                      <Image src={item.product.image} alt={item.product.name} fill sizes="64px" className="object-contain p-2" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-sans text-[13px] font-semibold text-white leading-tight truncate">{item.product.name}</h4>
                      {item.size && <p className="font-mono text-[10px] text-[#888] uppercase">Size: {item.size}</p>}
                      <p className="font-mono text-[12px] text-[#E5A93C] font-bold mt-1">
                        KES {(item.product.priceKes * item.qty).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => updateQty(item.product.id, item.size, -1)} className="w-6 h-6 bg-[#222] flex items-center justify-center text-white hover:bg-[#E50914] transition">
                        <Minus size={10} />
                      </button>
                      <span className="font-mono text-[12px] w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.product.id, item.size, 1)} className="w-6 h-6 bg-[#222] flex items-center justify-center text-white hover:bg-[#E50914] transition">
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-[#222]">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] uppercase text-[#888] tracking-[0.1em]">Subtotal</span>
                  <span className="font-mono text-lg font-bold text-white">KES {cartTotal.toLocaleString()}</span>
                </div>
                <Link href="/cart" onClick={() => setCartOpen(false)} className="btn-mpesa w-full justify-center">
                  Proceed to Checkout <ArrowRight size={14} />
                </Link>
                <p className="font-mono text-[10px] text-[#555] text-center uppercase tracking-[0.08em] mt-3">
                  M-Pesa STK Push · Daraja 2.0
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <MobileNav cartCount={cartCount} />
      <div className="h-16 md:hidden" />
    </div>
  );
}
