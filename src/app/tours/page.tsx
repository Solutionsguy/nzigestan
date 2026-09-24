"use client";

import { useState } from "react";
import Image from "next/image";
import SiteHeader from "@/components/layout/SiteHeader";
import MobileNav from "@/components/layout/MobileNav";
import { useAppData } from "@/context/AppDataContext";
import type { Event, EventCategory } from "@/types";
import { MapPin, Calendar, Users, ArrowRight, Ticket } from "lucide-react";

const CATEGORY_FILTERS: { id: EventCategory | "all"; label: string }[] = [
  { id: "all", label: "[All Gatherings]" },
  { id: "swarm-nature-hike", label: "[Swarm Nature Hikes]" },
  { id: "studio-live-taping", label: "[Studio Live Tapings]" },
  { id: "comedy-showcase", label: "[Standup Comedy Specials]" },
  { id: "diaspora-date", label: "[Diaspora Dates]" },
];

const CATEGORY_LABELS: Record<EventCategory, string> = {
  "swarm-nature-hike": "Swarm Nature Hike",
  "studio-live-taping": "Studio Live Taping",
  "comedy-showcase": "Standup Comedy Special",
  "diaspora-date": "Diaspora Date",
};

export default function ToursPage() {
  const { events, adjustEventCapacity } = useAppData();
  const [activeFilter, setActiveFilter] = useState<EventCategory | "all">("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [bookingStep, setBookingStep] = useState<"select" | "pay" | "confirm">("select");
  const [bookingStatus, setBookingStatus] = useState<"idle" | "sending" | "done">("idle");
  const [bookingError, setBookingError] = useState("");

  const filtered = activeFilter === "all"
    ? events
    : events.filter((e) => e.category === activeFilter);

  const openBooking = (event: Event) => {
    if (event.status === "sold-out") return;
    setSelectedEvent(event);
    setSelectedTier(event.ticketTiers[0]?.id || "");
    setBookingStep("select");
    setBookingStatus("idle");
    setBookingError("");
  };

  const selectedTierData = selectedEvent?.ticketTiers.find((t) => t.id === selectedTier);

  const handleBookingPay = async () => {
    if (!selectedEvent || !selectedTierData) return;
    setBookingStatus("sending");
    setBookingError("");
    try {
      // 1. Initiate STK push
      const stkRes = await fetch("/api/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: `254${phone.replace(/^0/, "")}`,
          amount: selectedTierData.priceKes,
          accountReference: "EVENTS-NZG",
          transactionDesc: `${selectedEvent.title} – ${selectedTierData.name}`,
        }),
      });
      if (!stkRes.ok) {
        const err = await stkRes.json().catch(() => ({}));
        throw new Error(err.error || "STK push failed");
      }

      // 2. Issue ticket / citizen pass
      await fetch("/api/tickets/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          eventTitle: selectedEvent.title,
          tierId: selectedTierData.id,
          tierName: selectedTierData.name,
          phone: `+254${phone.replace(/^0/, "")}`,
          amountPaid: selectedTierData.priceKes,
        }),
      });

      // 3. Decrement event capacity
      adjustEventCapacity(selectedEvent.id, -1);

      setBookingStatus("done");
      setBookingStep("confirm");
    } catch (err) {
      console.error("[Tours booking]", err);
      setBookingError(err instanceof Error ? err.message : "Payment failed. Please try again.");
      setBookingStatus("idle");
    }
  };


  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1]">
      <SiteHeader />

      {/* Hero header */}
      <div className="bg-[#0a0a0a] border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center gap-2 text-[#E50914] mb-4">
            <MapPin size={14} />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] font-bold">
              Physical Sector Broadcast // Expedition Corps
            </span>
          </div>
          <h1 className="font-headline text-5xl sm:text-7xl uppercase text-white leading-none mb-4">
            TOURS, HIKES<br />&amp; GATHERINGS
          </h1>
          <p className="font-sans text-[#888] text-base max-w-2xl mb-6 leading-relaxed">
            <span className="text-[#E50914] font-semibold">Tuko kwa barabara</span> on this physical
            odyssey. Step off the digital stream and join Emmanuel, Bashir, Nduta, Chinese, Jack Alita,
            and the Laf Lyf crew across Kenya.
          </p>
          <div className="flex flex-wrap gap-2">
            {["#TukoKwaBarabara", "#ItawesaSana", "#KuingiaMtaro", "#LafLyfLive"].map((tag) => (
              <span key={tag} className="font-mono text-[10px] uppercase tracking-[0.1em] bg-white/5 border border-white/10 px-3 py-1 text-[#888]">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-2 mb-10 overflow-x-auto pb-2">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`font-mono text-[11px] uppercase tracking-[0.1em] px-4 py-2.5 border shrink-0 transition-colors ${
                activeFilter === cat.id
                  ? "bg-[#E50914] text-white border-[#E50914]"
                  : "bg-transparent text-[#888] border-[#333] hover:border-[#555] hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Events grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Featured event — large */}
          {filtered[0] && (
            <article className="lg:col-span-7 card group flex flex-col">
              <div className="relative h-72 overflow-hidden">
                <Image
                  src={filtered[0].coverImage}
                  alt={filtered[0].title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] bg-[#E50914] text-white px-2 py-1">
                    {CATEGORY_LABELS[filtered[0].category]}
                  </span>
                  {filtered[0].status === "sold-out" && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] bg-[#222] text-[#555] px-2 py-1">
                      Sold Out
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h2 className="font-headline text-3xl uppercase text-white mb-1 group-hover:text-[#E50914] transition-colors">
                  {filtered[0].title}
                </h2>
                {filtered[0].subtitle && (
                  <p className="font-sans text-[13px] text-[#888] mb-5">{filtered[0].subtitle}</p>
                )}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#aaa]">
                    <MapPin size={12} className="text-[#E5A93C] shrink-0" />
                    {filtered[0].venue}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#aaa]">
                    <Calendar size={12} className="text-[#E5A93C] shrink-0" />
                    {new Date(filtered[0].date).toDateString()} · {filtered[0].time}
                  </div>
                  <div className="col-span-2 flex items-center gap-2 font-mono text-[11px] text-[#aaa]">
                    <Users size={12} className="text-[#E5A93C] shrink-0" />
                    {filtered[0].capacityBooked} / {filtered[0].capacityTotal} Booked —{" "}
                    <span className={filtered[0].status === "sold-out" ? "text-[#555]" : "text-[#E50914]"}>
                      {filtered[0].status === "sold-out"
                        ? "SOLD OUT"
                        : `Only ${filtered[0].capacityTotal - filtered[0].capacityBooked} passes left`}
                    </span>
                  </div>
                </div>
                {/* Capacity bar */}
                <div className="h-[2px] bg-[#222] mb-5">
                  <div
                    className="h-full bg-[#E50914]"
                    style={{ width: `${(filtered[0].capacityBooked / filtered[0].capacityTotal) * 100}%` }}
                  />
                </div>
                {/* Ticket tiers preview */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {filtered[0].ticketTiers.map((tier) => (
                    <div key={tier.id} className="bg-[#0a0a0a] border border-[#222] px-3 py-2">
                      <p className="font-mono text-[10px] uppercase text-[#888] tracking-[0.08em]">{tier.name}</p>
                      <p className="font-mono text-sm font-bold text-[#E5A93C]">KES {tier.priceKes.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => openBooking(filtered[0])}
                  disabled={filtered[0].status === "sold-out"}
                  className={`mt-auto w-full flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] py-3 transition-all ${
                    filtered[0].status === "sold-out"
                      ? "bg-[#1a1a1a] text-[#444] cursor-not-allowed"
                      : "btn-primary glow-red"
                  }`}
                >
                  <Ticket size={14} />
                  {filtered[0].status === "sold-out" ? "Sold Out" : "Book Your Pass"}
                </button>
              </div>
            </article>
          )}

          {/* Remaining events — stacked list */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {filtered.slice(1).map((event) => (
              <article key={event.id} className="card group flex gap-0 overflow-hidden">
                <div className="relative w-28 sm:w-36 shrink-0">
                  <Image
                    src={event.coverImage}
                    alt={event.title}
                    fill
                    sizes="(max-width: 640px) 112px, 144px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#141414]/60" />
                </div>
                <div className="p-4 flex flex-col flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#E50914]">
                      {CATEGORY_LABELS[event.category]}
                    </span>
                    <span className={`font-mono text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5 shrink-0 ${
                      event.status === "sold-out" ? "bg-[#1a1a1a] text-[#555]" : "bg-[#E50914]/10 text-[#E50914]"
                    }`}>
                      {event.status === "sold-out" ? "Sold Out" : "On Sale"}
                    </span>
                  </div>
                  <h3 className="font-headline text-lg uppercase text-white leading-tight mb-1 group-hover:text-[#E50914] transition-colors">
                    {event.title}
                  </h3>
                  <p className="font-mono text-[10px] text-[#666] mb-1 truncate">{event.venue}</p>
                  <p className="font-mono text-[10px] text-[#555] mb-3">
                    {new Date(event.date).toDateString()} · {event.time}
                  </p>
                  {/* Mini capacity bar */}
                  <div className="h-[2px] bg-[#222] mb-3">
                    <div className="h-full bg-[#E50914]"
                      style={{ width: `${(event.capacityBooked / event.capacityTotal) * 100}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#666]">
                      From KES {Math.min(...event.ticketTiers.map((t) => t.priceKes)).toLocaleString()}
                    </span>
                    <button
                      onClick={() => openBooking(event)}
                      disabled={event.status === "sold-out"}
                      className={`font-mono text-[10px] uppercase tracking-[0.08em] px-3 py-1.5 transition-colors ${
                        event.status === "sold-out"
                          ? "text-[#444] cursor-not-allowed"
                          : "bg-[#E50914] text-white hover:bg-[#FF0033]"
                      }`}
                    >
                      {event.status === "sold-out" ? "Sold Out" : "Book →"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOOKING MODAL ────────────────────────────────── */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedEvent(null)} />
          <div className="relative w-full max-w-lg bg-[#131313] border border-[#333] max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-[#222]">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#E50914] mb-1">
                  Book Your Pass
                </p>
                <h3 className="font-headline text-xl uppercase text-white">{selectedEvent.title}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-[#888] hover:text-white transition font-mono text-xl">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {bookingStep === "select" && (
                <>
                  {/* Event details */}
                  <div className="bg-[#0a0a0a] border border-[#222] p-4 space-y-2">
                    <div className="flex items-center gap-2 font-mono text-[11px] text-[#aaa]">
                      <MapPin size={12} className="text-[#E5A93C]" /> {selectedEvent.venue}
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px] text-[#aaa]">
                      <Calendar size={12} className="text-[#E5A93C]" />
                      {new Date(selectedEvent.date).toDateString()} · {selectedEvent.time}
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px] text-[#E50914]">
                      <Users size={12} />
                      Only {selectedEvent.capacityTotal - selectedEvent.capacityBooked} passes remaining
                    </div>
                  </div>

                  {/* Tier selector */}
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#888] mb-3">
                      Select Pass Tier
                    </p>
                    <div className="space-y-2">
                      {selectedEvent.ticketTiers.map((tier) => (
                        <button
                          key={tier.id}
                          onClick={() => setSelectedTier(tier.id)}
                          className={`w-full text-left p-4 border transition-colors ${
                            selectedTier === tier.id
                              ? "border-[#E50914] bg-[#E50914]/5"
                              : "border-[#222] bg-[#0a0a0a] hover:border-[#333]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-sans text-[13px] font-semibold text-white">{tier.name}</span>
                            <span className="font-mono text-sm font-bold text-[#E5A93C]">
                              KES {tier.priceKes.toLocaleString()}
                            </span>
                          </div>
                          <p className="font-mono text-[10px] text-[#666]">{tier.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setBookingStep("pay")}
                    disabled={!selectedTier}
                    className="btn-primary w-full justify-center"
                  >
                    Continue to Payment <ArrowRight size={14} />
                  </button>
                </>
              )}

              {bookingStep === "pay" && selectedTierData && (
                <>
                  <div className="bg-[#0a0a0a] border border-[#222] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-[10px] text-[#888] uppercase mb-1">{selectedTierData.name}</p>
                        <p className="font-sans text-[13px] text-white">{selectedEvent.title}</p>
                      </div>
                      <span className="font-mono text-lg font-bold text-[#E5A93C]">
                        KES {selectedTierData.priceKes.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#888] block mb-2">
                      Safaricom Phone Number
                    </label>
                    <div className="flex gap-0">
                      <span className="input-terminal w-16 shrink-0 text-center text-[#888] border-r-0">
                        +254
                      </span>
                      <input
                        type="tel"
                        placeholder="7XX XXX XXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        maxLength={9}
                        className="input-terminal flex-1"
                      />
                    </div>
                    <p className="font-mono text-[10px] text-[#555] mt-2">
                      You&apos;ll receive an M-Pesa STK Push to approve the payment
                    </p>
                  </div>

                  <button
                    onClick={handleBookingPay}
                    disabled={phone.length < 9 || bookingStatus === "sending"}
                    className="btn-mpesa w-full justify-center"
                  >
                    {bookingStatus === "sending"
                      ? "Sending STK Push…"
                      : `Pay KES ${selectedTierData.priceKes.toLocaleString()} via M-Pesa →`}
                  </button>
                  {bookingError && (
                    <p className="font-mono text-[10px] text-[#E50914] text-center mt-1">{bookingError}</p>
                  )}
                  <p className="font-mono text-[10px] text-[#444] text-center uppercase tracking-[0.08em]">
                    Paybill 522522 · Account EVENTS-NZG
                  </p>
                  <button onClick={() => setBookingStep("select")} className="w-full text-center font-mono text-[10px] text-[#555] hover:text-[#888] transition uppercase tracking-[0.08em]">
                    ← Back
                  </button>
                </>
              )}

              {bookingStep === "confirm" && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#E50914]/10 border border-[#E50914]/30 flex items-center justify-center mx-auto mb-4">
                    <Ticket size={28} className="text-[#E50914]" />
                  </div>
                  <h3 className="font-headline text-2xl uppercase text-white mb-2">STK Push Sent</h3>
                  <p className="font-sans text-[13px] text-[#888] mb-6 leading-relaxed">
                    Check your Safaricom handset (+254 {phone}) for the M-Pesa payment prompt.
                    Your digital QR Citizen Pass will be sent via SMS upon confirmation.
                  </p>
                  <div className="bg-[#0a0a0a] border border-[#222] p-4 mb-6 text-left">
                    <p className="font-mono text-[10px] text-[#666] uppercase tracking-[0.1em] mb-1">Your Citizen Pass</p>
                    <p className="font-headline text-xl text-[#E5A93C]">{selectedEvent.title}</p>
                    <p className="font-mono text-[11px] text-[#888]">{selectedTierData?.name}</p>
                    <p className="font-mono text-[10px] text-[#555] mt-2">QR code will be delivered to +254 {phone}</p>
                  </div>
                  <button onClick={() => { setSelectedEvent(null); setBookingStep("select"); setPhone(""); }}
                    className="btn-secondary w-full justify-center">
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <MobileNav />
      <div className="h-16 md:hidden" />
    </div>
  );
}
