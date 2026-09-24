import { NextResponse } from "next/server";
import { verifyMpesaCallback } from "@/lib/mpesa";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-mpesa-signature") || "";
    const consumerSecret = process.env.DARAJA_CONSUMER_SECRET || "";

    // Verify callback signature if secret is configured
    if (consumerSecret && !verifyMpesaCallback(body, signature, consumerSecret)) {
      console.warn("[M-Pesa] Invalid callback signature rejected");
      return NextResponse.json(
        { ResultCode: 1, ResultDesc: "Unauthorized — invalid signature" },
        { status: 401 }
      );
    }

    const callbackData = JSON.parse(body);
    console.log("M-PESA DARAJA 2.0 CALLBACK RECEIVED:", JSON.stringify(callbackData, null, 2));

    const stkCallback = callbackData?.Body?.stkCallback;

    if (!stkCallback) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid payload format" });
    }

    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;
    const merchantRequestId = stkCallback.MerchantRequestID || "";
    const checkoutRequestId = stkCallback.CheckoutRequestID || "";

    if (resultCode === 0) {
      // Payment Successful
      interface CallbackMetadataItem {
        Name?: string;
        Value?: string | number;
      }
      const items: CallbackMetadataItem[] = stkCallback.CallbackMetadata?.Item || [];
      const mpesaReceipt = String(items.find((i) => i.Name === "MpesaReceiptNumber")?.Value || "");
      const amount = Number(items.find((i) => i.Name === "Amount")?.Value || 0);
      const phone = String(items.find((i) => i.Name === "PhoneNumber")?.Value || "");

      console.log(`✓ M-Pesa Payment Succeeded: Receipt: ${mpesaReceipt}, Amount: KES ${amount}, Phone: ${phone}, CheckoutID: ${checkoutRequestId}, MerchantID: ${merchantRequestId}`);

      // Update database/store order or donor ledger if applicable
      try {
        const { updateOrderStatus: updateStoreOrder, addDonor: addStoreDonor } = await import("@/lib/serverStore");
        if (checkoutRequestId) {
          updateStoreOrder(checkoutRequestId, "paid");
        }
        if (amount > 0) {
          addStoreDonor({
            name: `Citizen (${phone ? phone.slice(-4) : "Swarm"})`,
            amountKes: amount,
            tier: amount >= 10000 ? "Gold Locust Oligarch" : amount >= 5000 ? "Swarm Pioneer" : "Swarm Citizen",
            shoutoutPinned: amount >= 5000,
          });
        }
      } catch (storeErr) {
        console.warn("[M-Pesa Callback] Store update notice:", storeErr);
      }
    } else {
      console.warn(`✕ M-Pesa Payment Failed / Cancelled by User (${resultCode}): ${resultDesc} [CheckoutID: ${checkoutRequestId}, MerchantID: ${merchantRequestId}]`);
    }

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Callback accepted successfully",
    });
  } catch (err) {
    console.error("M-Pesa Callback Processing Error:", err);
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Server processing error" }, { status: 500 });
  }
}
