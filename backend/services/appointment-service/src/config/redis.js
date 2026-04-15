import { Queue } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL;

export const redisConnection = redisUrl
  ? new IORedis(redisUrl, { maxRetriesPerRequest: null })
  : null;

export let holdExpiryQueue;
export let reminderQueue;
export let waitlistQueue;

export const initQueues = async () => {
  if (!redisConnection) {
    return;
  }

  holdExpiryQueue = new Queue("slot-hold-expiry", { connection: redisConnection });
  reminderQueue = new Queue("appointment-reminders", { connection: redisConnection });
  waitlistQueue = new Queue("waitlist-promotions", { connection: redisConnection });
};
