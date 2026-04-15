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
      if (existingAdmin.role !== "SUPER_ADMIN") {
        existingAdmin.role = "SUPER_ADMIN";
        existingAdmin.isEmailVerified = true;
        existingAdmin.accountStatus = "ACTIVE";
        existingAdmin.doctorVerificationStatus = "NOT_REQUIRED";
        await existingAdmin.save();
        console.log("Existing seeded admin promoted to SUPER_ADMIN");
        process.exit(0);
      }

      console.log("Super admin user already exists");
      process.exit(0);
    }

    const passwordHash = await hashPassword("Admin@12345");

    await User.create({
      fullName: "System Admin",
      email: "admin@smarthealth.com",
      phone: "0700000000",
      passwordHash,
      role: "SUPER_ADMIN",
      isEmailVerified: true,
      accountStatus: "ACTIVE",
      doctorVerificationStatus: "NOT_REQUIRED"
    });

    console.log("Super admin user seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

seedAdmin();
