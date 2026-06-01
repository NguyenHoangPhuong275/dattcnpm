import { NextResponse } from "next/server";

/**
 * Health Check Endpoint
 * 
 * Used by Docker, load balancers, and monitoring tools.
 * Should remain lightweight and never depend on external services
 * (keep it as a pure "is the process alive?" check).
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV ?? "unknown",
    // Intentionally minimal — do not add DB/Redis checks here.
    // Use dedicated /debug/* endpoints (properly secured) for deeper diagnostics.
  });
}
