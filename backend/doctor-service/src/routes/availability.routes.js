import express from "express";
import verifyToken from "../middlewares/auth.middleware.js";
import {
  handleAddBlockedDate,
  handleCheckAvailability,
  handleGetAvailability,
  handleGetBlockedDates,
  handleRemoveBlockedDate,
  handleUpdateAvailability
} from "../controllers/availability.controller.js";

const router = express.Router();

router.use(verifyToken);

router.get("/:doctorId/blocked-dates", handleGetBlockedDates);
router.post("/:doctorId/blocked-dates", handleAddBlockedDate);
router.delete("/:doctorId/blocked-dates/:dateString", handleRemoveBlockedDate);
router.get("/:doctorId/is-available", handleCheckAvailability);
router.get("/:doctorId", handleGetAvailability);
router.put("/:doctorId", handleUpdateAvailability);

export default router;
