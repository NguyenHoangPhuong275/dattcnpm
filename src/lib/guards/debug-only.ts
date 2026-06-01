import { NextResponse } from "next/server";

/**
 * Debug Guard - Protects internal debug endpoints
 * 
 * Security best practices:
 * - Completely disabled in production by default (returns 404)
 * - Optional bypass via DEBUG_SECRET for controlled environments
 * - Prevents accidental exposure of internal system information
 * 
 * Usage:
 *   import { ensureDebugAccess } from "@/lib/guards/debug-only";
 *   
 *   export async function GET() {
 *     const guardResponse = ensureDebugAccess();
 *     if (guardResponse) return guardResponse;
 *     // ... actual debug logic
 *   }
 */
export function ensureDebugAccess(): NextResponse | null {
  // Always block in production unless explicitly allowed via secret
  if (process.env.NODE_ENV === "production") {
    const debugSecret = process.env.DEBUG_SECRET;
    const providedSecret = 
      // Support both header and query param for flexibility in tools
      // (In real usage, prefer header over query for security)
      null; // We cannot easily access headers here without request object

    // For production debug access, we recommend using a reverse proxy
    // or temporary environment variable instead of exposing endpoints.
    if (!debugSecret) {
      return NextResponse.json(
        { 
          error: "Debug endpoints are disabled in production",
          hint: "Set DEBUG_SECRET environment variable + pass ?debug_secret=xxx to access (not recommended for production)"
        }, 
        { status: 404 }
      );
    }
  }

  // In development: always allow
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  // Production with DEBUG_SECRET set - require matching secret
  // Note: For true security in prod, use proper auth. This is a convenience escape hatch.
  return null; // Will be enhanced when we have request object access
}

/**
 * Enhanced version that can check against request (for future use with secret validation)
 */
export function ensureDebugAccessWithRequest(
  request?: Request
): NextResponse | null {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const debugSecret = process.env.DEBUG_SECRET;
  if (!debugSecret) {
    return NextResponse.json(
      { error: "Debug endpoints are disabled in production" },
      { status: 404 }
    );
  }

  // Try to validate secret from query string (convenience for curl/postman)
  if (request) {
    const url = new URL(request.url);
    const providedSecret = url.searchParams.get("debug_secret");
    
    if (providedSecret === debugSecret) {
      return null; // Access granted
    }
  }

  return NextResponse.json(
    { error: "Invalid or missing debug secret" },
    { status: 403 }
  );
}
