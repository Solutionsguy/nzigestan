"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import MobileNav from "@/components/layout/MobileNav";
import {
  SHIPPING_OPTIONS,
  NAIROBI_WARDS,
  PROMO_CODES,
  PAYBILL,
  ACCOUNT_MERCH,
} from "@/lib/constants";
import { useAppData } from "@/context/AppDataContext";
import { useCart } from "@/context/CartContext";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Trash2,
} from "lucide-react";

export default function CartCheckoutPage() {
  const { promoCodes, adjustStock } = useAppData();
  const { cart: items, removeFromCart, clearCart, cartCount, cartTotal: subtotal } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [ward, setWard] = useState(NAIROBI_WARDS[0]);
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");
  const [stkStatus, setStkStatus] = useState<"idle" | "sending" | "confirmed">("idle");
  const [confirmedOrderId, setConfirmedOrderId] = useState("");

  const selectedShipping = SHIPPING_OPTIONS.find((s) => s.id === shippingMethod);
  const shippingFee = selectedShipping ? Math.max(0, selectedShipping.priceKes) : 0;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    const rule = promoCodes[code] || PROMO_CODES[code];

    if (!rule) {
      alert("Invalid promo code. Try ITAWESASANA for 10% off!");
      return;
    }

    if (rule.isActive === false) {
      alert(`Promo code '${code}' is currently paused.`);
      return;
    }

    if (rule.expiresAt) {
      const expDate = new Date(rule.expiresAt);
      if (new Date() > expDate) {
        alert(`Promo code '${code}' expired on ${rule.expiresAt}.`);
        return;
      }
    }

    if (rule.minSpendKes && subtotal < rule.minSpendKes) {
      alert(`Promo code '${code}' requires a minimum spend of KES ${rule.minSpendKes.toLocaleString()}. (Current: KES ${subtotal.toLocaleString()})`);
      return;
    }

    if (rule.maxUses && rule.usedCount && rule.usedCount >= rule.maxUses) {
      alert(`Promo code '${code}' has reached its maximum redemption limit.`);
      return;
    }

    if (rule.type === "percent") {
      setDiscountPercent(Number(rule.value));
      setPromoMessage(`${rule.value}% discount applied!`);
    } else {
      setPromoMessage("Free Fan Sticker Pack included with order!");
    }
    setPromoApplied(true);
  };

  const handleTriggerCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 9) {
      alert("Please enter a valid Safaricom phone number (+254)");
      return;
    }

    setStkStatus("sending");
    try {
      // 1. Initiate M-Pesa STK push
      const stkRes = await fetch("/api/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: `254${phone.replace(/^0/, "")}`,
          amount: grandTotal,
          accountReference: ACCOUNT_MERCH,
          transactionDesc: `Nzigestan Merch Order – ${items.map((i) => i.product.name).join(", ")}`,
        }),
      });
      if (!stkRes.ok) {
        const err = await stkRes.json().catch(() => ({}));
        throw new Error(err.error || "STK push failed");
      }

      // 2. Generate order ID and record order
      const orderId = `NZG-${Date.now().toString().slice(-6)}`;
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createOrder",
          order: {
            id: orderId,
            customerName: name || "Swarm Citizen",
            phone: `+254${phone.replace(/^0/, "")}`,
            items: items.map((i) => ({
              productId: i.product.id,
              name: i.product.name,
              qty: i.qty,
              size: i.size,
              priceKes: i.product.priceKes,
            })),
            subtotal,
            discount: discountAmount,
            shipping: shippingFee,
            total: grandTotal,
            shippingMethod,
            ward,
            promoCode: promoApplied ? promoCode.toUpperCase() : null,
            status: "pending",
            createdAt: new Date().toISOString(),
          },
        }),
      });

      // 3. Decrement stock for each purchased item
      items.forEach((item) => adjustStock(item.product.id, -item.qty));

      // 4. Clear cart and confirm
      clearCart();
      setConfirmedOrderId(orderId);
      setStkStatus("confirmed");
    } catch (err) {
      console.error("[Checkout] Error:", err);
      alert(`Checkout failed: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`);
      setStkStatus("idle");
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1]">
      <SiteHeader cartCount={cartCount} />

      <div className="bg-[#0a0a0a] border-b border-[#222] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#E5A93C]">
              Daraja 2.0 Encrypted Rails
            </span>
            <h1 className="font-headline text-3xl sm:text-4xl uppercase text-white">
              STREETWEAR CART &amp; M-PESA CHECKOUT
            </h1>
          </div>
          <Link href="/merch" className="font-mono text-[11px] text-[#888] hover:text-white uppercase">
            ← Continue Shopping
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {stkStatus === "confirmed" ? (
          <div className="max-w-xl mx-auto card p-8 text-center glow-gold border-[#E5A93C]/40">
            <CheckCircle2 size={48} className="text-[#E5A93C] mx-auto mb-4 animate-bounce" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#E5A93C]">
              Payment Verified
            </span>
            <h2 className="font-headline text-3xl uppercase text-white mb-2">
              DISPATCH ORDER #{confirmedOrderId} CONFIRMED
            </h2>
            <p className="font-sans text-[14px] text-[#aaa] mb-6 leading-relaxed">
              M-Pesa STK transaction confirmed from <strong>+254 {phone}</strong>. Your streetwear items will be dispatched via <strong>{selectedShipping?.label}</strong> to <strong>{ward}</strong>.
            </p>
            <div className="bg-[#0e0e0e] border border-[#222] p-4 text-left font-mono text-[11px] space-y-1 mb-6">
              <div className="flex justify-between">
                <span className="text-[#666]">Account Reference:</span>
                <span className="text-white">{ACCOUNT_MERCH}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666]">Total Paid:</span>
                <span className="text-[#E5A93C] font-bold">KES {grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666]">Recipient:</span>
                <span className="text-white">{name || "Swarm Citizen"}</span>
              </div>
            </div>
            <Link href="/merch" className="btn-primary inline-flex justify-center w-full">
              Back to Merch Store
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Col: Order Manifest (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <h2 className="font-mono text-[11px] uppercase tracking-widest text-[#888] mb-2">
                [ 01 // Order Manifest ]
              </h2>

              <div className="card divide-y divide-[#222]">
                {items.length === 0 ? (
                  <div className="p-8 text-center text-[#666] font-mono text-xs">
                    Cart is empty.
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={`${item.product.id}-${item.size ?? "nosize"}`} className="p-4 flex gap-4 items-center">
                      <div className="relative w-14 h-14 bg-[#0a0a0a] border border-[#222] shrink-0">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          sizes="56px"
                          className="object-contain p-1.5"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-sans text-[13px] font-semibold text-white truncate">
                          {item.product.name}
                        </h4>
                        <div className="font-mono text-[10px] text-[#888] flex gap-2">
                          {item.size && <span>Size: {item.size}</span>}
                          <span>Qty: {item.qty}</span>
                        </div>
                        <span className="font-mono text-[12px] font-bold text-[#E5A93C]">
                          KES {(item.product.priceKes * item.qty).toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id, item.size)}
                        className="text-[#555] hover:text-[#E50914] p-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Promo Code Box */}
              <form onSubmit={handleApplyPromo} className="card p-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Promo code (e.g. ITAWESASANA)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="input-terminal text-[12px] py-1.5 uppercase flex-1"
                />
                <button type="submit" className="btn-secondary text-[11px] px-3 py-1.5">
                  Apply
                </button>
              </form>
              {promoApplied && (
                <p className="font-mono text-[10px] text-[#E5A93C] flex items-center gap-1">
                  ✓ {promoMessage || `Promo applied: ${discountPercent}% discount`}
                </p>
              )}

              {/* Price Calculation Summary */}
              <div className="card p-4 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-[#888]">
                  <span>Subtotal</span>
                  <span>KES {subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#E5A93C]">
                    <span>Discount</span>
                    <span>- KES {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#888]">
                  <span>Courier Delivery</span>
                  <span>KES {shippingFee.toLocaleString()}</span>
                </div>
                <div className="border-t border-[#222] pt-2 flex justify-between text-base font-bold text-white">
                  <span>Total Amount</span>
                  <span className="text-[#E5A93C]">KES {grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Right Col: Dispatch & M-Pesa Rails (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <h2 className="font-mono text-[11px] uppercase tracking-widest text-[#888] mb-2">
                [ 02 // Nairobi Dispatch & Delivery Details ]
              </h2>

              <form onSubmit={handleTriggerCheckout} className="card p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">
                      Citizen Name / Moniker
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Emmanuel Otieno"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-terminal"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">
                      Delivery Ward (Nairobi Metro)
                    </label>
                    <select
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      className="input-terminal bg-[#121212]"
                    >
                      {NAIROBI_WARDS.map((w) => (
                        <option key={w} value={w} className="bg-[#121212] text-white">
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Shipping Method Selector */}
                <div>
                  <label className="font-mono text-[10px] uppercase text-[#888] block mb-2">
                    Shipping &amp; Courier Carrier
                  </label>
                  <div className="space-y-2">
                    {SHIPPING_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-center justify-between p-3 border cursor-pointer transition ${
                          shippingMethod === opt.id
                            ? "bg-[#E50914]/5 border-[#E50914]"
                            : "bg-[#0a0a0a] border-[#222] hover:border-[#333]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={shippingMethod === opt.id}
                            onChange={() => setShippingMethod(opt.id)}
                            className="accent-[#E50914]"
                          />
                          <span className="font-sans text-[13px] text-white">{opt.label}</span>
                        </div>
                        <span className="font-mono text-[12px] font-bold text-[#E5A93C]">
                          {opt.priceKes === 0 ? "FREE" : opt.priceKes > 0 ? `KES ${opt.priceKes}` : "Quote"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* M-Pesa STK Prompt Container */}
                <div className="pt-4 border-t border-[#222] space-y-3">
                  <div className="flex items-center gap-2 text-[#E5A93C]">
                    <Zap size={16} />
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider">
                      Safaricom M-Pesa Daraja 2.0 STK Express
                    </span>
                  </div>

                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#888] block mb-1">
                      Safaricom Mobile Number (+254)
                    </label>
                    <div className="flex gap-0">
                      <span className="input-terminal w-16 shrink-0 text-center text-[#888] border-r-0">
                        +254
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="7XX XXX XXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        maxLength={9}
                        className="input-terminal flex-1 text-base font-mono text-[#E5A93C]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={stkStatus === "sending" || items.length === 0}
                    className="btn-mpesa w-full justify-center text-sm py-3.5 glow-gold"
                  >
                    {stkStatus === "sending" ? (
                      <span className="animate-pulse">Triggering STK Push to Phone...</span>
                    ) : (
                      <>
                        Pay KES {grandTotal.toLocaleString()} via M-Pesa STK Push
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-[#666] font-mono text-[10px] pt-1">
                    <span>Paybill: {PAYBILL}</span>
                    <span>Account: {ACCOUNT_MERCH}</span>
                    <span className="flex items-center gap-1 text-[#888]">
                      <ShieldCheck size={12} /> 256-bit Encrypted
                    </span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <MobileNav />
      <div className="h-16 md:hidden" />
    </div>
  );
}
