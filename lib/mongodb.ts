import mongoose from 'mongoose';

// MongoDB Atlas connection string loaded from environment variables.
const MONGODB_URI = process.env.MONGODB_URI || '';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // Store the connection cache globally during development.
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache =
  global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

// Reuse an existing connection when possible to avoid
// creating multiple MongoDB connections during development.
async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('Please define MONGODB_URI environment variable');
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  try {
    // Create a new connection to MongoDB Atlas.
    cached.promise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.conn = null;
    cached.promise = null;
    throw error;
  }
}

export default connectDB;