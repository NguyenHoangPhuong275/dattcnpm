import mongoose from "mongoose";

// Environment validation
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("❌ MONGODB_URI is not defined in environment variables. Please check your .env file.");
}

const uri = MONGODB_URI as string;

// Connection options optimized for Next.js + production
const mongooseOptions: mongoose.ConnectOptions = {
  bufferCommands: false,           // Disable buffering so we fail fast on connection issues
  maxPoolSize: 10,                 // Limit concurrent connections (good for serverless + small VPS)
  minPoolSize: 1,
  serverSelectionTimeoutMS: 5000,  // Fail fast if MongoDB is unreachable
  socketTimeoutMS: 45000,
  // Add retry logic at driver level
  retryWrites: true,
  retryReads: true,
};

// Global singleton cache for development hot reloads
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  status: "disconnected" | "connecting" | "connected" | "error";
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoose: MongooseCache | undefined;
}

let cached = global.__mongoose;

if (!cached) {
  cached = global.__mongoose = {
    conn: null,
    promise: null,
    status: "disconnected",
  };
}

// ==================== CONNECTION FUNCTION ====================

/**
 * Connect to MongoDB with production-grade resilience and singleton pattern.
 * - Reuses connection across hot reloads in development
 * - Proper error handling (does not crash the app on transient failures)
 * - Connection status tracking for health checks
 */
async function dbConnect(): Promise<typeof mongoose> {
  // Return existing connection if healthy
  if (cached!.conn && cached!.status === "connected") {
    return cached!.conn;
  }

  // If a connection attempt is already in progress, wait for it
  if (cached!.promise) {
    try {
      cached!.conn = await cached!.promise;
      return cached!.conn;
    } catch (err) {
      // Previous attempt failed — clear and retry below
      cached!.promise = null;
      cached!.status = "error";
    }
  }

  // Start new connection attempt
  cached!.status = "connecting";

  cached!.promise = mongoose
    .connect(uri, mongooseOptions)
    .then((mongooseInstance) => {
      cached!.status = "connected";
      console.log("✅ [MongoDB] Connected successfully");
      return mongooseInstance;
    })
    .catch((err) => {
      cached!.status = "error";
      cached!.promise = null; // Allow future retries
      console.error("❌ [MongoDB] Connection failed:", err.message);
      throw err; // Re-throw so callers can handle (or fail fast)
    });

  try {
    cached!.conn = await cached!.promise;
    return cached!.conn;
  } catch (err) {
    cached!.conn = null;
    throw err;
  }
}

// ==================== EVENT LISTENERS (for observability) ====================

mongoose.connection.on("connected", () => {
  if (cached) cached.status = "connected";
  console.log("✅ [MongoDB] Mongoose connected");
});

mongoose.connection.on("error", (err) => {
  if (cached) cached.status = "error";
  console.error("❌ [MongoDB] Mongoose connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  if (cached) cached.status = "disconnected";
  console.warn("⚠️  [MongoDB] Mongoose disconnected");
});

// Graceful shutdown
const shutdown = async () => {
  try {
    await mongoose.connection.close();
    console.log("👋 [MongoDB] Connection closed gracefully");
  } catch (err) {
    console.error("[MongoDB] Error during shutdown:", err);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// ==================== EXPORTS ====================

export default dbConnect;

/**
 * Get current MongoDB connection status (non-blocking, useful for health checks)
 */
export function getMongoStatus(): string {
  return cached?.status || "unknown";
}

/**
 * Check if MongoDB is currently connected (non-blocking)
 */
export function isMongoConnected(): boolean {
  return cached?.status === "connected" && !!cached?.conn;
}
