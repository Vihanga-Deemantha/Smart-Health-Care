import { Router } from "express";
import { body } from "express-validator";
import protect from "../middlewares/auth.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import { handleChat } from "../controllers/chat.controller.js";

const router = Router();

const chatValidation = [
  body("message")
    .trim()
    .notEmpty()
    .withMessage("message is required")
    .isLength({ min: 3, max: 2000 })
    .withMessage("message must be between 3 and 2000 characters")
];

router.use(protect);
router.post("/chat", chatValidation, validateRequest, handleChat);

export default router;
