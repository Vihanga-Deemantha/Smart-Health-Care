import Appointment from "../models/Appointment.js";
import AvailabilityRule from "../models/AvailabilityRule.js";
import SlotHold from "../models/SlotHold.js";
import TimeOff from "../models/TimeOff.js";
import { buildSlots, buildSlotsFromTimeRange, overlaps } from "../utils/dateTime.js";
import { APPOINTMENT_STATUS } from "../utils/constants.js";
import {
  getDoctorAvailabilitySchedule,
  searchDoctorsFromDoctorService
} from "../integrations/doctorService.client.js";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const toDateKey = (value) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
};

export const searchDoctors = async (filters) => {
  return searchDoctorsFromDoctorService(filters);
};

export const getDoctorAvailability = async ({ doctorId, date, mode }) => {
  const targetDate = new Date(date);
  const weekday = targetDate.getUTCDay();

  const rules = await AvailabilityRule.find({ doctorId, weekday, mode, active: true }).lean();

  const weekdayName = WEEKDAYS[weekday];
  let generated = [];

  if (rules.length > 0) {
    generated = rules.flatMap((rule) =>
      buildSlots({
        date: targetDate,
        startHour: rule.startHour,
        endHour: rule.endHour,
        durationMinutes: rule.slotDurationMinutes,
        bufferMinutes: rule.bufferMinutes
      })
    );
  } else {
    const schedule = await getDoctorAvailabilitySchedule(doctorId);

    if (!schedule || !Array.isArray(schedule.weeklySchedule)) {
      return [];
    }

    if (Array.isArray(schedule.offDays) && schedule.offDays.includes(weekdayName)) {
      return [];
    }

    const targetKey = toDateKey(targetDate);
    const isBlocked = Array.isArray(schedule.blockedDates)
      ? schedule.blockedDates.some((entry) => toDateKey(entry.date) === targetKey)
      : false;

    if (isBlocked) {
      return [];
    }

    generated = schedule.weeklySchedule
      .filter(
        (slot) =>
          slot &&
          slot.weekday === weekdayName &&
          (slot.mode ? slot.mode === mode : true) &&
          slot.isActive !== false
      )
      .flatMap((slot) =>
        buildSlotsFromTimeRange({
          date: targetDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          durationMinutes: Number(slot.duration || 30),
          bufferMinutes: 0
        })
      );
  }

  if (generated.length === 0) {
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
