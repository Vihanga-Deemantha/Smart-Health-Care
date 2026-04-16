const buildTimeOptions = () => {
  const options = [];

  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 30) {
      const hourLabel = String(hour).padStart(2, "0");
      const minuteLabel = String(minute).padStart(2, "0");
      options.push(`${hourLabel}:${minuteLabel}`);
    }
  }

  return options;
};

export const TIME_OPTIONS = buildTimeOptions();

export const formatTime = (time) => {
  if (typeof time !== "string") {
    return "";
  }

  const [hours, minutes] = time.split(":");
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);

  if (Number.isNaN(parsedHours) || Number.isNaN(parsedMinutes)) {
    return time;
  }

  const period = parsedHours >= 12 ? "PM" : "AM";
  const normalizedHours = parsedHours % 12 || 12;
  const displayHours = String(normalizedHours).padStart(2, "0");
  const displayMinutes = String(parsedMinutes).padStart(2, "0");

  return `${displayHours}:${displayMinutes} ${period}`;
};
