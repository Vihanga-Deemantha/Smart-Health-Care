const toDateValue = (appointment) =>
  appointment?.appointmentDate || appointment?.startTime || appointment?.scheduledAt || null;

const parseDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

export const groupAppointmentsByDate = (appointments = []) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = appointments
    .filter((appointment) => {
      const date = parseDate(toDateValue(appointment));
      return date && date >= today;
    })
    .sort((a, b) => {
      const first = parseDate(toDateValue(a));
      const second = parseDate(toDateValue(b));
      return (first?.getTime() || 0) - (second?.getTime() || 0);
    });

  const groups = {};

  filtered.forEach((appointment) => {
    const date = parseDate(toDateValue(appointment));
    if (!date) {
      return;
    }

    const dateKey = date.toISOString().split("T")[0];
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(appointment);
  });

  const todayKey = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().split("T")[0];

  return Object.keys(groups)
    .sort()
    .map((dateKey) => {
      const date = new Date(dateKey);
      let label = "";

      if (dateKey === todayKey) {
        label = "TODAY";
      } else if (dateKey === tomorrowKey) {
        label = "TOMORROW";
      }

      const fullDate = date.toLocaleDateString("en-LK", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });

      return {
        dateKey,
        label,
        fullDate,
        appointments: groups[dateKey].sort((a, b) => {
          const first = parseDate(toDateValue(a));
          const second = parseDate(toDateValue(b));
          return (first?.getTime() || 0) - (second?.getTime() || 0);
        })
      };
    });
};
