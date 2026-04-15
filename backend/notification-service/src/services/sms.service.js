import env from "../config/env.js";
import { formatNotifyLK } from "../utils/phone.utils.js";

export const sendSms = async ({ to, message }) => {
  const formatted = formatNotifyLK(to);

  if (!formatted) {
    throw new Error("Invalid SMS recipient phone");
  }

  if (!env.notifyLkUserId || !env.notifyLkApiKey || !env.notifyLkSenderId) {
    throw new Error("Notify.lk credentials not configured");
  }

  const body = new URLSearchParams({
    user_id: env.notifyLkUserId,
    api_key: env.notifyLkApiKey,
    sender_id: env.notifyLkSenderId,
    to: formatted,
    message
  });

  const response = await fetch(env.notifyLkApiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });

  const text = await response.text();
  let payload = null;

  try {
    payload = JSON.parse(text);
  } catch (err) {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(`Notify.lk request failed: HTTP ${response.status}`);
  }

  if (payload && payload.status !== "success") {
    throw new Error(`Notify.lk error: ${payload.data || "unknown"}`);
  }

  return payload || { status: "success", data: text };
};
