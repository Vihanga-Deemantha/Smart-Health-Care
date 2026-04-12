import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import SlotHold from "../models/SlotHold.js";
import Appointment from "../models/Appointment.js";
import { publishEvent } from "../events/publishers/eventPublisher.js";
import { promoteWaitlistForSlot } from "../services/appointment.service.js";

export const initWorkers = () => {
  if (!redisConnection) {
    return;
  }

  new Worker(
    "slot-hold-expiry",
    async (job) => {
      const hold = await SlotHold.findById(job.data.holdId);

      if (!hold || hold.status !== "ACTIVE") {
        return;
      }

      hold.status = "EXPIRED";
      hold.releasedAt = new Date();
      hold.releaseReason = "TTL_EXPIRED";
      await hold.save();

      await publishEvent("slot.released", {
        holdId: hold._id.toString(),
        doctorId: hold.doctorId,
        patientId: hold.patientId,
        reason: "TTL_EXPIRED"
      });
    },
    { connection: redisConnection }
  );

  new Worker(
    "appointment-reminders",
    async (job) => {
      const appointment = await Appointment.findById(job.data.appointmentId);
      if (!appointment) {
        return;
      }

      await publishEvent("notification.appointment.reminder", {
        appointmentId: appointment._id.toString(),
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        startTime: appointment.startTime,
        type: job.data.type
      });
    },
    { connection: redisConnection }
  );

  new Worker(
    "waitlist-promotions",
    async (job) => {
      await promoteWaitlistForSlot(job.data);
    },
    { connection: redisConnection }
  );
};
