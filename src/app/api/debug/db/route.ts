import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { ensureDebugAccessWithRequest } from "@/lib/guards/debug-only";

/**
 * DEBUG ENDPOINT - MongoDB Connection Health
 * 
 * ⚠️ SECURITY: This endpoint is protected and disabled in production by default.
 * Only available during development or with valid DEBUG_SECRET.
 */
export async function GET(request: Request) {
  // Security guard - blocks access in production unless explicitly allowed
  const guardResponse = ensureDebugAccessWithRequest(request);
  if (guardResponse) return guardResponse;

  try {
    const mongooseInstance = await dbConnect();

    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const connectionState = mongooseInstance.connection.readyState;

    const stateMap: Record<number, string> = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    return NextResponse.json({
      status: "success",
      connected: connectionState === 1,
      connectionState: stateMap[connectionState] ?? "unknown",
      dbName: mongooseInstance.connection.name,
      host: mongooseInstance.connection.host,
      // Do not expose credentials or sensitive config
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    // Never leak stack traces or internal details to client
    return NextResponse.json(
      {
        status: "error",
        connected: false,
        message: "Failed to connect to MongoDB",
        // Only include detailed error in development
        ...(process.env.NODE_ENV !== "production" && { detail: message }),
      },
      { status: 500 }
    );
  }
}
