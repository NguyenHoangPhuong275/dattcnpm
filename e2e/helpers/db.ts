import mongoose from 'mongoose';
import Redis from 'ioredis';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let connected = false;

async function connection() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI is required for E2E');
  if (!connected) {
    await mongoose.connect(MONGODB_URI);
    connected = true;
  }
  return mongoose.connection;
}

export async function seedOtp(email: string, code: string): Promise<void> {
  const redis = new Redis(REDIS_URL);
  try {
    const key = `otp:${email.toLowerCase()}`;
    await redis.del(key);
    await redis.hset(key, 'code', code, 'attempts', '0');
    await redis.expire(key, 600);
  } finally {
    await redis.quit();
  }
}

export async function seedPlace(name = 'E2E Test Place'): Promise<string> {
  const conn = await connection();
  const _id = new mongoose.Types.ObjectId();
  await conn.collection('places').insertOne({
    _id,
    name,
    type: 'custom',
    address: 'E2E address',
    lat: 16.06,
    lng: 108.22,
    ratingAvg: 0,
    ratingCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return String(_id);
}

export async function cleanup(opts: { email?: string; tripId?: string; placeId?: string }): Promise<void> {
  const conn = await connection();
  if (opts.email) {
    await conn.collection('users').deleteMany({ email: opts.email.toLowerCase() });
  }
  if (opts.tripId) {
    await conn
      .collection('trips')
      .deleteOne({ _id: new mongoose.Types.ObjectId(opts.tripId) })
      .catch(() => undefined);
    await conn.collection('itinerary_items').deleteMany({ tripId: opts.tripId });
    await conn.collection('trip_checklists').deleteMany({ tripId: opts.tripId });
  }
  if (opts.placeId) {
    await conn
      .collection('places')
      .deleteOne({ _id: new mongoose.Types.ObjectId(opts.placeId) })
      .catch(() => undefined);
  }
}

export async function closeDb(): Promise<void> {
  if (connected) {
    await mongoose.disconnect();
    connected = false;
  }
}
