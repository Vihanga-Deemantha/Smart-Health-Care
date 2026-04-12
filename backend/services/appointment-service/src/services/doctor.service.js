import Appointment from "../models/Appointment.js";
import AvailabilityRule from "../models/AvailabilityRule.js";
import SlotHold from "../models/SlotHold.js";
import TimeOff from "../models/TimeOff.js";
import { buildSlots, overlaps } from "../utils/dateTime.js";
import { APPOINTMENT_STATUS } from "../utils/constants.js";
import { searchDoctorsFromDoctorService } from "../integrations/doctorService.client.js";

export const searchDoctors = async (filters) => {
  return searchDoctorsFromDoctorService(filters);
};

export const getDoctorAvailability = async ({ doctorId, date, mode }) => {
  const targetDate = new Date(date);
  const weekday = targetDate.getUTCDay();

  const rules = await AvailabilityRule.find({ doctorId, weekday, mode, active: true }).lean();

  if (rules.length === 0) {
    return [];
  }

  const startDay = new Date(targetDate);
  startDay.setUTCHours(0, 0, 0, 0);
  const endDay = new Date(targetDate);
  endDay.setUTCHours(23, 59, 59, 999);

  const [appointments, holds, timeOff] = await Promise.all([
    Appointment.find({
      doctorId,
      startTime: { $gte: startDay, $lte: endDay },
      status: { $in: [APPOINTMENT_STATUS.BOOKED, APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.HOLD] }
    }).lean(),
    SlotHold.find({
      doctorId,
      startTime: { $gte: startDay, $lte: endDay },
      status: "ACTIVE",
      expiresAt: { $gt: new Date() }
    }).lean(),
    TimeOff.find({
      doctorId,
      active: true,
      startTime: { $lte: endDay },
      endTime: { $gte: startDay }
    }).lean()
  ]);

  const generated = rules.flatMap((rule) =>
    buildSlots({
      date: targetDate,
      startHour: rule.startHour,
      endHour: rule.endHour,
      durationMinutes: rule.slotDurationMinutes,
      bufferMinutes: rule.bufferMinutes
    })
  );

  return generated
    .filter((slot) => {
      const appointmentConflict = appointments.some((a) => overlaps(slot.startTime, slot.endTime, a.startTime, a.endTime));
      const holdConflict = holds.some((h) => overlaps(slot.startTime, slot.endTime, h.startTime, h.endTime));
      const timeOffConflict = timeOff.some((t) => overlaps(slot.startTime, slot.endTime, t.startTime, t.endTime));
      return !appointmentConflict && !holdConflict && !timeOffConflict;
    })
    .map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      mode
    }));
};
