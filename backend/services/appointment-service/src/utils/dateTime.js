import { addMinutes, isWithinInterval, set } from "date-fns";

export const buildSlots = ({ date, startHour, endHour, durationMinutes, bufferMinutes = 0 }) => {
  const slots = [];
  let current = set(date, {
    hours: startHour,
    minutes: 0,
    seconds: 0,
    milliseconds: 0
  });

  const end = set(date, {
    hours: endHour,
    minutes: 0,
    seconds: 0,
    milliseconds: 0
  });

  while (addMinutes(current, durationMinutes) <= end) {
    const slotEnd = addMinutes(current, durationMinutes);
    slots.push({ startTime: new Date(current), endTime: new Date(slotEnd) });
    current = addMinutes(slotEnd, bufferMinutes);
  }

  return slots;
};

const parseTime = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const [hours, minutes] = value.split(":");
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);

  if (Number.isNaN(parsedHours) || Number.isNaN(parsedMinutes)) {
    return null;
  }

  if (parsedHours < 0 || parsedHours > 23 || parsedMinutes < 0 || parsedMinutes > 59) {
    return null;
  }

  return { hours: parsedHours, minutes: parsedMinutes };
};

export const buildSlotsFromTimeRange = ({
  date,
  startTime,
  endTime,
  durationMinutes,
  bufferMinutes = 0
}) => {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const duration = Number(durationMinutes);

  if (!start || !end || Number.isNaN(duration) || duration <= 0) {
    return [];
  }

  const slots = [];
  let current = set(date, {
    hours: start.hours,
    minutes: start.minutes,
    seconds: 0,
    milliseconds: 0
  });

  const endBoundary = set(date, {
    hours: end.hours,
    minutes: end.minutes,
    seconds: 0,
    milliseconds: 0
  });

  if (endBoundary <= current) {
    return [];
  }

  while (addMinutes(current, duration) <= endBoundary) {
    const slotEnd = addMinutes(current, duration);
    slots.push({ startTime: new Date(current), endTime: new Date(slotEnd) });
    current = addMinutes(slotEnd, bufferMinutes);
  }

  return slots;
};

export const overlaps = (aStart, aEnd, bStart, bEnd) => {
  return isWithinInterval(aStart, { start: bStart, end: bEnd }) ||
    isWithinInterval(aEnd, { start: bStart, end: bEnd }) ||
    isWithinInterval(bStart, { start: aStart, end: aEnd }) ||
    isWithinInterval(bEnd, { start: aStart, end: aEnd });
};
