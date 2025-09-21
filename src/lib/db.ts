

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string; // ✅ Tell TS it's always a string

if (!MONGODB_URI) {
  throw new Error("❌ Please define the MONGODB_URI environment variable in your .env file");
}

// Use a cached connection object to avoid multiple DB connections during hot reload
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // If a connection already exists, return it
  if (cached.conn) return cached.conn;

  // If no connection yet, create one
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false, // Prevents Mongoose from buffering commands
      })
      .then((mongooseInstance) => mongooseInstance);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
