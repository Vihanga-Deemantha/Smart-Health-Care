const toMinutes = (time) => {
  if (typeof time !== "string") {
    return Number.NaN;
  }

  const [hours, minutes] = time.split(":");
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);

  if (Number.isNaN(parsedHours) || Number.isNaN(parsedMinutes)) {
    return Number.NaN;
  }

  return parsedHours * 60 + parsedMinutes;
};

export const validateSlots = (slots = []) => {
  const errors = [];

  if (!Array.isArray(slots)) {
    return ["Slots must be an array"];
  }

  const slotsByDay = {};

  slots.forEach((slot) => {
    const start = toMinutes(slot.startTime);
    const end = toMinutes(slot.endTime);

    if (Number.isNaN(start) || Number.isNaN(end)) {
      return;
    }

    if (end <= start) {
      errors.push("Slot end time must be after start time");
      return;
    }

    if (!slotsByDay[slot.weekday]) {
      slotsByDay[slot.weekday] = [];
    }

    slotsByDay[slot.weekday].push({
      start,
      end,
      range: `${slot.startTime}-${slot.endTime}`
    });
  });

  Object.entries(slotsByDay).forEach(([day, daySlots]) => {
    for (let i = 0; i < daySlots.length; i += 1) {
      for (let j = i + 1; j < daySlots.length; j += 1) {
        const first = daySlots[i];
        const second = daySlots[j];

        if (first.start < second.end && first.end > second.start) {
          errors.push(`Overlap on ${day}: ${first.range} conflicts with ${second.range}`);
        }
      }
    }
  });

  return errors;
};
