import Availability from "../models/Availability.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/apiResponse.js";
import AppError from "../utils/AppError.js";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

const formatDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDateInput = (dateString) => {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return null;
  }

  const [year, month, day] = dateString.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const normalizeWeeklySchedule = (weeklySchedule = []) => {
  if (!Array.isArray(weeklySchedule)) {
    return [];
  }

  return weeklySchedule.map((slot) => ({
    weekday: slot.weekday,
    startTime: slot.startTime,
    endTime: slot.endTime,
    duration: Number(slot.duration || 30),
    mode: slot.mode,
    isActive: typeof slot.isActive === "boolean" ? slot.isActive : true
  }));
};

const getOrCreateAvailability = async (doctorId) => {
  let availability = await Availability.findOne({ doctorId });

  if (!availability) {
    availability = new Availability({
      doctorId,
      weeklySchedule: [],
      offDays: [],
      blockedDates: []
    });
  }

  return availability;
};

export const handleGetAvailability = asyncHandler(async (req, res) => {
  const availability = await Availability.findOne({ doctorId: req.params.doctorId }).lean();

  sendResponse(res, 200, "Availability fetched", {
    availability: availability || {
      doctorId: req.params.doctorId,
      weeklySchedule: [],
      offDays: [],
      blockedDates: []
    }
  });
});

export const handleUpdateAvailability = asyncHandler(async (req, res) => {
  const { weeklySchedule, offDays } = req.body || {};

  if (!Array.isArray(weeklySchedule)) {
    throw new AppError("Weekly schedule is required", 400, "BAD_REQUEST");
  }

  const normalizedSchedule = normalizeWeeklySchedule(weeklySchedule);
  const normalizedOffDays = Array.isArray(offDays) ? [...new Set(offDays)] : [];

  const availability = await getOrCreateAvailability(req.params.doctorId);
  availability.weeklySchedule = normalizedSchedule;
  availability.offDays = normalizedOffDays;

  await availability.save();

  sendResponse(res, 200, "Availability updated", { availability });
});

export const handleAddBlockedDate = asyncHandler(async (req, res) => {
  const { date, reason } = req.body || {};
  const parsedDate = parseDateInput(date);

  if (!parsedDate) {
    throw new AppError("Invalid date format. Use YYYY-MM-DD", 400, "BAD_REQUEST");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (parsedDate < today) {
    throw new AppError("Cannot block a past date", 400, "BAD_REQUEST");
  }

  if (reason && reason.length > 100) {
    throw new AppError("Reason must be 100 characters or less", 400, "BAD_REQUEST");
  }

  const availability = await getOrCreateAvailability(req.params.doctorId);
  const dateKey = formatDateKey(parsedDate);

  if (availability.blockedDates.some((entry) => formatDateKey(entry.date) === dateKey)) {
    throw new AppError("This date is already blocked", 409, "CONFLICT");
  }

  availability.blockedDates.push({
    date: parsedDate,
    reason: reason?.trim() || "Leave"
  });

  availability.blockedDates.sort((a, b) => new Date(a.date) - new Date(b.date));
  await availability.save();

  sendResponse(res, 200, "Blocked date added", { availability });
});

export const handleRemoveBlockedDate = asyncHandler(async (req, res) => {
  const parsedDate = parseDateInput(req.params.dateString);

  if (!parsedDate) {
    throw new AppError("Invalid date format. Use YYYY-MM-DD", 400, "BAD_REQUEST");
  }

  const availability = await Availability.findOne({ doctorId: req.params.doctorId });

  if (!availability) {
    throw new AppError("Availability not found", 404, "NOT_FOUND");
  }

  const dateKey = formatDateKey(parsedDate);
  const nextBlockedDates = availability.blockedDates.filter(
    (entry) => formatDateKey(entry.date) !== dateKey
  );

  if (nextBlockedDates.length === availability.blockedDates.length) {
    throw new AppError("Blocked date not found", 404, "NOT_FOUND");
  }

  availability.blockedDates = nextBlockedDates;
  await availability.save();

  sendResponse(res, 200, "Blocked date removed", { availability });
});

export const handleGetBlockedDates = asyncHandler(async (req, res) => {
  const availability = await Availability.findOne({ doctorId: req.params.doctorId }).lean();
  const blockedDates = availability?.blockedDates || [];

  sendResponse(res, 200, "Blocked dates fetched", { blockedDates });
});

export const handleCheckAvailability = asyncHandler(async (req, res) => {
  const parsedDate = parseDateInput(req.query.date);

  if (!parsedDate) {
    throw new AppError("Invalid date format. Use YYYY-MM-DD", 400, "BAD_REQUEST");
  }

  const availability = await Availability.findOne({ doctorId: req.params.doctorId }).lean();

  if (!availability) {
    sendResponse(res, 200, "Availability checked", { available: true });
    return;
  }

  const dateKey = formatDateKey(parsedDate);
  const blockedEntry = availability.blockedDates?.find(
    (entry) => formatDateKey(entry.date) === dateKey
  );

  if (blockedEntry) {
    sendResponse(res, 200, "Availability checked", {
      available: false,
      reason: blockedEntry.reason || "Blocked date"
    });
    return;
  }

  const weekdayName = WEEKDAYS[parsedDate.getDay()];

  if (availability.offDays?.includes(weekdayName)) {
    sendResponse(res, 200, "Availability checked", {
      available: false,
      reason: `Day off: ${weekdayName}`
    });
    return;
  }

  sendResponse(res, 200, "Availability checked", { available: true });
});
