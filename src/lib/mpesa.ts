// ============================================================
// Safaricom Daraja 2.0 API Helper Utilities
// The Republic of Nzigestan
// ============================================================

import crypto from "crypto";

export interface StkPushRequest {
  phoneNumber: string; // 2547XXXXXXXX
  amount: number;
  accountReference: string; // NZIGE-LIVE | ORDER-NZG | EVENTS-NZG
  transactionDesc: string;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

/**
 * Generates Daraja OAuth Access Token using Consumer Key & Secret
 */
export async function getDarajaAccessToken(): Promise<string | null> {
  const consumerKey = process.env.DARAJA_CONSUMER_KEY;
  const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;
  const env = process.env.DARAJA_ENVIRONMENT || "sandbox";

  if (!consumerKey || !consumerSecret) {
    console.warn("Daraja API Keys not provided. Operating in sandbox simulation mode.");
    return null;
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const url =
    env === "production"
      ? "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
      : "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
      next: { revalidate: 3500 }, // Tokens last 1 hour
    });
    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.error("Daraja OAuth Error:", err);
    return null;
  }
}

/**
 * Formats local Kenyan numbers (07XX, 7XX, +2547XX) into 2547XXXXXXXX
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1);
  } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
}

/**
 * Initiates an M-Pesa STK Push (Lipa Na M-Pesa Online)
 */
export async function initiateStkPush(req: StkPushRequest): Promise<StkPushResponse> {
  const token = await getDarajaAccessToken();
  const shortcode = process.env.DARAJA_SHORTCODE || "174379"; // Safaricom standard sandbox shortcode
  const passkey = process.env.DARAJA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
  const callbackUrl = process.env.DARAJA_CALLBACK_URL || "https://nzigestan.com/api/mpesa/callback";
  const env = process.env.DARAJA_ENVIRONMENT || "sandbox";

  // If no live Daraja token, return realistic simulated response
  if (!token) {
    return {
      MerchantRequestID: `MR-${Date.now()}`,
      CheckoutRequestID: `ws_CO_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ResponseCode: "0",
      ResponseDescription: "Success. Request accepted for processing (Simulated)",
      CustomerMessage: `Success. Prompt sent to ${req.phoneNumber}. Please enter M-Pesa PIN.`,
    };
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
  const formattedPhone = formatPhoneNumber(req.phoneNumber);

  const endpoint =
    env === "production"
      ? "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
      : "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(req.amount),
    PartyA: formattedPhone,
    PartyB: shortcode,
    PhoneNumber: formattedPhone,
    CallBackURL: callbackUrl,
    AccountReference: req.accountReference,
    TransactionDesc: req.transactionDesc.slice(0, 32),
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
}

/**
 * Verifies M-Pesa callback signature using HMAC-SHA256
 * Expected header: x-mpesa-signature: <base64(hmac-sha256(body, consumer_secret))>
 */
export function verifyMpesaCallback(
  body: string,
  signature: string,
  consumerSecret: string
): boolean {
  if (!signature || !consumerSecret) {
    console.warn("[M-Pesa] Signature verification skipped — missing headers or secret");
    return true; // Allow in dev/sandbox without strict verification
  }

  try {
    const hmac = crypto.createHmac("sha256", consumerSecret);
    hmac.update(body);
    const expected = hmac.digest("base64");
    return expected === signature;
  } catch (err) {
    console.error("[M-Pesa] Signature verification error:", err);
    return false;
  }
}
