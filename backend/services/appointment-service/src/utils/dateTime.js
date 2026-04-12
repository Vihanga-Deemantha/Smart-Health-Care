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

export const overlaps = (aStart, aEnd, bStart, bEnd) => {
  return isWithinInterval(aStart, { start: bStart, end: bEnd }) ||
    isWithinInterval(aEnd, { start: bStart, end: bEnd }) ||
    isWithinInterval(bStart, { start: aStart, end: aEnd }) ||
    isWithinInterval(bEnd, { start: aStart, end: aEnd });
};
