import "./config/env.js";
import mongoose from "mongoose";
import app from "./app.js";

const PORT = Number(process.env.PORT) || 5029;
const MONGO_URI = process.env.MONGO_URI;

const startServer = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not defined");
    }

    await mongoose.connect(MONGO_URI);
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
