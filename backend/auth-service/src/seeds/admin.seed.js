import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import { hashPassword } from "../utils/hash.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ email: "admin@smarthealth.com" });

    if (existingAdmin) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    const passwordHash = await hashPassword("Admin@12345");

    await User.create({
      fullName: "System Admin",
      email: "admin@smarthealth.com",
      phone: "0700000000",
      passwordHash,
      role: "ADMIN",
      isEmailVerified: true,
      accountStatus: "ACTIVE",
      doctorVerificationStatus: "NOT_REQUIRED"
    });

    console.log("Admin user seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

seedAdmin();
