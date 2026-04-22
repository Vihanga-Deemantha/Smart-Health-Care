import { Worker } from "bullmq";
import { randomUUID } from "crypto";
import { redisConnection } from "../config/redis.js";
import SlotHold from "../models/SlotHold.js";
import Appointment from "../models/Appointment.js";
import { publishEvent } from "../events/publishers/eventPublisher.js";
import { promoteWaitlistForSlot } from "../services/appointment.service.js";
import { getDoctorProfile } from "../integrations/doctorService.client.js";
import { getPatientProfile } from "../integrations/patientService.client.js";

const buildRecipientSummary = (profile, id, fallbackName) => ({
  userId: profile?.userId || profile?._id || profile?.id || id || null,
  fullName: profile?.fullName || profile?.name || fallbackName,
  email: profile?.email || null,
  phone: profile?.contactNumber || profile?.phone || null
});

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

      const [doctorProfile, patientProfile] = await Promise.all([
        getDoctorProfile(appointment.doctorId),
        getPatientProfile(appointment.patientId)
      ]);

      await publishEvent("notification.appointment.reminder", {
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        appointmentId: appointment._id.toString(),
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        appointmentDate: appointment.appointmentDate,
        mode: appointment.mode,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        type: job.data.type,
        patient: buildRecipientSummary(patientProfile, appointment.patientId, "Patient"),
        doctor: buildRecipientSummary(doctorProfile, appointment.doctorId, "Doctor")
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
