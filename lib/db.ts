import mongoose from 'mongoose';

interface MongooseGlobal {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalAny = global as unknown as { _mongoose?: MongooseGlobal };
const cache: MongooseGlobal = globalAny._mongoose ?? {
  conn: null,
  promise: null,
};
globalAny._mongoose = cache;

export async function dbConnect(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  // Read at call time so env mutations during dev hot-reload are honored
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim().length === 0) {
    throw new Error(
      'MONGODB_URI is not set. Add it to .env.local (development) or your Vercel environment variables (production).'
    );
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 20000,
      compressors: ['zlib'],
    });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
