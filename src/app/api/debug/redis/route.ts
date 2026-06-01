import { NextResponse } from "next/server";
import redisClient, { getRedisStatus, isRedisAvailable } from "@/lib/redis";
import { ensureDebugAccessWithRequest } from "@/lib/guards/debug-only";

/**
 * DEBUG ENDPOINT - Redis Connection Health
 * 
 * ⚠️ SECURITY: This endpoint is protected and disabled in production by default.
 * Only available during development or with valid DEBUG_SECRET.
 */
export async function GET(request: Request) {
  // Security guard
  const guardResponse = ensureDebugAccessWithRequest(request);
  if (guardResponse) return guardResponse;

  try {
    // Use non-blocking status first for fast response
    const currentStatus = getRedisStatus();
    const isAvailable = isRedisAvailable();

    // Only attempt ping if we believe we're connected (avoids long timeouts)
    let pingResponse: string | null = null;

    if (isAvailable) {
      try {
        pingResponse = await redisClient.ping();
      } catch {
        pingResponse = null;
      }
    }

    return NextResponse.json({
      status: "success",
      connected: pingResponse === "PONG",
      statusDetail: currentStatus,
      response: pingResponse,
      // Useful for monitoring
      info: {
        available: isAvailable,
        // Do not expose internal connection details
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        status: "error",
        connected: false,
        message: "Failed to connect to Redis",
        ...(process.env.NODE_ENV !== "production" && { detail: message }),
      },
      { status: 500 }
    );
  }
}
