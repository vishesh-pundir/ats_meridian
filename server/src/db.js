import mongoose from "mongoose";

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is missing. Copy .env.example to .env and set a MongoDB connection string.");
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}
