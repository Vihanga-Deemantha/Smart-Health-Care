import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required");
  }

  const conn = await mongoose.connect(mongoUri, {
    maxPoolSize: 15,
    minPoolSize: 3
  });

  logger.info("MongoDB connected", { host: conn.connection.host });
};

export default connectDB;
