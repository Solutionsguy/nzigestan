import { NextResponse } from "next/server";
import { formatPhoneNumber } from "@/lib/mpesa";

export async function POST(req: Request) {
  try {
    const { eventId, tierId, phone, attendeeName, mpesaReceipt } = await req.json();

    if (!phone || !eventId) {
      return NextResponse.json(
        { error: "Event ID and Phone number are required." },
        { status: 400 }
      );
    }

    const citizenId = `NZG-${Math.floor(100 + Math.random() * 900)}-NRB`;
    const qrToken = `QR-${Buffer.from(`${citizenId}:${eventId}:${mpesaReceipt || Date.now()}`).toString("base64")}`;
    const formattedPhone = formatPhoneNumber(phone);

    console.log(`[SMS Gateway Simulator] Dispatching SMS to +${formattedPhone} for ${attendeeName || "Citizen"} (Tier: ${tierId || "regular"})...`);
    console.log(`[SMS Content]: "THE REPUBLIC OF NZIGESTAN: Your Citizen Pass (${citizenId}) for Event is confirmed. Entry QR: ${qrToken}. Tuko kwa barabara!"`);

    return NextResponse.json({
      success: true,
      citizenId,
      tierId: tierId || "regular",
      attendeeName: attendeeName || "Citizen",
      qrToken,
      phone: formattedPhone,
      status: "ISSUED",
      smsDispatched: true,
    });
  } catch (err) {
    console.error("Ticket Issue API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error issuing ticket pass." },
      { status: 500 }
    );
  }
}
