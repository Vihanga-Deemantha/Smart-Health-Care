import "./config/env.js";
import mongoose from "mongoose";
import app from "./app.js";

const PORT = Number(process.env.PORT) || 5029;
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

const startServer = async () => {
  try {
    if (!mongoUri) {
      throw new Error("MongoDB connection string is not defined");
    }

    await mongoose.connect(mongoUri);
    console.log("Doctor DB connected");

    app.listen(PORT, () => {
      console.log(`Doctor service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Doctor service startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
