import Stripe from "stripe";
import AppError from "../utils/AppError.js";

let stripeClient = null;

export const getStripeClient = () => {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new AppError("STRIPE_SECRET_KEY is not configured", 500, "STRIPE_NOT_CONFIGURED");
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: "2024-06-20"
  });

  return stripeClient;
};
