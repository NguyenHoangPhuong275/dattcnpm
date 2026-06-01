import Redis, { RedisOptions } from "ioredis";

// Environment validation
const REDIS_URL = process.env.REDIS_URL!; // Safe after runtime check below

if (!REDIS_URL) {
  throw new Error("❌ REDIS_URL is not defined in environment variables. Please check your .env file.");
}

// Redis connection options with production-grade resilience
const redisOptions: RedisOptions = {
  // Connection settings
  maxRetriesPerRequest: 3,           // Limit retries for individual commands
  enableReadyCheck: true,            // Wait for Redis to be ready before resolving
  connectTimeout: 10000,             // 10s connection timeout

  // Reconnection strategy (exponential backoff with max delay)
  retryStrategy(times: number): number | null {
    const delay = Math.min(times * 200, 5000); // 200ms, 400ms, ..., max 5s
    console.warn(`[Redis] Reconnecting attempt #${times}. Next retry in ${delay}ms`);
    return delay;
  },

  // Reconnect on these errors (prevents app crash on transient failures)
  reconnectOnError(err: Error): boolean {
    const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT", "ECONNREFUSED"];
    const shouldReconnect = targetErrors.some((target) => err.message.includes(target));

    if (shouldReconnect) {
      console.warn(`[Redis] Reconnecting due to error: ${err.message}`);
    }
    return shouldReconnect;
  },

  // Lazy connect: only connect when first command is issued
  lazyConnect: true,
};

// Global singleton for development (prevents connection explosion on hot reload)
declare global {
  // eslint-disable-next-line no-var
  var __redisClient: Redis | undefined;
  // eslint-disable-next-line no-var
  var __redisConnectionStatus: "disconnected" | "connecting" | "connected" | "error" | undefined;
}

let redisClient: Redis;

// Initialize Redis client with proper singleton pattern
function createRedisClient(): Redis {
  if (process.env.NODE_ENV === "production") {
    // Production: always create fresh instance (serverless friendly)
    return new Redis(REDIS_URL, redisOptions);
  }

  // Development: reuse across hot reloads
  if (!global.__redisClient) {
    global.__redisClient = new Redis(REDIS_URL, redisOptions);
    global.__redisConnectionStatus = "disconnected";
  }
  return global.__redisClient;
}

redisClient = createRedisClient();

// ==================== EVENT HANDLERS (Critical for resilience) ====================

redisClient.on("connect", () => {
  if (global.__redisConnectionStatus) global.__redisConnectionStatus = "connecting";
  console.log("✅ [Redis] Connecting to server...");
});

redisClient.on("ready", () => {
  if (global.__redisConnectionStatus) global.__redisConnectionStatus = "connected";
  console.log("✅ [Redis] Connection ready - cache & rate limiting active");
});

redisClient.on("error", (err: Error) => {
  if (global.__redisConnectionStatus) global.__redisConnectionStatus = "error";
  // IMPORTANT: We log but DO NOT throw. This prevents the entire app from crashing
  // when Redis is temporarily unavailable (graceful degradation).
  console.error("❌ [Redis] Connection error (app will continue without cache/rate limit):", err.message);
});

redisClient.on("close", () => {
  if (global.__redisConnectionStatus) global.__redisConnectionStatus = "disconnected";
  console.warn("⚠️  [Redis] Connection closed. Cache & rate limiting are temporarily disabled.");
});

redisClient.on("reconnecting", (delay: number) => {
  console.log(`🔄 [Redis] Reconnecting in ${delay}ms...`);
});

// ==================== GRACEFUL SHUTDOWN ====================

// Ensure clean disconnect on process termination
const shutdown = async () => {
  try {
    await redisClient.quit();
    console.log("👋 [Redis] Connection closed gracefully");
  } catch (err) {
    console.error("[Redis] Error during shutdown:", err);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// ==================== EXPORTS ====================

/**
 * Redis client instance with production-grade resilience.
 * - Never crashes the app on connection failure
 * - Automatic reconnection with exponential backoff
 * - Proper singleton in development
 * - Clean shutdown handling
 */
export default redisClient;

/**
 * Current connection status (useful for health checks and monitoring)
 */
export function getRedisStatus(): string {
  return global.__redisConnectionStatus || "unknown";
}

/**
 * Check if Redis is currently usable (non-blocking)
 */
export function isRedisAvailable(): boolean {
  return global.__redisConnectionStatus === "connected";
}
