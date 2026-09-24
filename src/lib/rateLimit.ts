import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_CONFIG = {
  windowMs: 60_000, // 1 minute window
  maxRequests: 30, // max requests per window
};

export function rateLimit(req: Request | NextRequest, key?: string): boolean {
  const clientKey = key || req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();

  let entry = rateLimitMap.get(clientKey);

  // Reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_CONFIG.windowMs };
  }

  entry.count++;
  rateLimitMap.set(clientKey, entry);

  // Clean up old entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetAt < now) rateLimitMap.delete(k);
    }
  }

  return entry.count <= RATE_LIMIT_CONFIG.maxRequests;
}

export function rateLimitResponse(limit: number, retryAfterMs: number) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": Math.ceil(retryAfterMs / 1000).toString(),
        "RateLimit-Limit": limit.toString(),
      },
    }
  );
}
