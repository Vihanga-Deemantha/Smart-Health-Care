import express from "express";
import protect from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import { handleGetDashboardStats } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/stats", protect, allowRoles("ADMIN"), handleGetDashboardStats);

export default router;

