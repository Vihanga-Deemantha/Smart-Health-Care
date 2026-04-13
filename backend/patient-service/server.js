import "./src/config/env.js";
import mongoose from "mongoose";
import app from "./app.js";

const PORT = Number(process.env.PORT) || 5028;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Patient DB connected");

    app.listen(PORT, () => {
      console.log(`Patient service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Patient service startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
