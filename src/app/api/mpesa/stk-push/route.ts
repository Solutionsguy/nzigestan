import { NextResponse } from "next/server";
import { initiateStkPush, StkPushRequest } from "@/lib/mpesa";

export async function POST(req: Request) {
  try {
    const body: StkPushRequest = await req.json();

    if (!body.phoneNumber || !body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: "Phone number and positive amount are required." },
        { status: 400 }
      );
    }

    const result = await initiateStkPush({
      phoneNumber: body.phoneNumber,
      amount: body.amount,
      accountReference: body.accountReference || "NZIGE-LIVE",
      transactionDesc: body.transactionDesc || "Nzigestan Fan Funding",
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("STK Push API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error initiating M-Pesa STK push." },
      { status: 500 }
    );
  }
}
