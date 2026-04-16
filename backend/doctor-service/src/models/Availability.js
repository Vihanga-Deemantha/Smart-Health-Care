import mongoose from "mongoose";

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const availabilitySchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      unique: true
    },
    weeklySchedule: [
      {
        weekday: { type: String, enum: WEEKDAYS, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        duration: { type: Number, default: 30 },
        mode: { type: String, enum: ["TELEMEDICINE", "IN_PERSON"], required: true },
        isActive: { type: Boolean, default: true }
      }
    ],
    offDays: [{ type: String, enum: WEEKDAYS }],
    blockedDates: [
      {
        date: { type: Date, required: true },
        reason: { type: String, default: "Leave" }
      }
    ]
  },
  { timestamps: true }
);

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

const buildValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = "BAD_REQUEST";
  return error;
};

availabilitySchema.pre("save", function (next) {
  if (!Array.isArray(this.weeklySchedule) || this.weeklySchedule.length === 0) {
    return next();
  }

  const slotsByDay = new Map();

  for (const slot of this.weeklySchedule) {
    if (!slot?.weekday) {
      continue;
    }

    const start = toMinutes(slot.startTime);
    const end = toMinutes(slot.endTime);

    if (Number.isNaN(start) || Number.isNaN(end)) {
      return next(buildValidationError(`Invalid time format on ${slot.weekday}. Use HH:MM.`));
    }

    if (end <= start) {
      return next(buildValidationError("Slot end time must be after start time"));
    }

    if (!slotsByDay.has(slot.weekday)) {
      slotsByDay.set(slot.weekday, []);
    }

    slotsByDay.get(slot.weekday).push({
      start,
      end,
      startTime: slot.startTime,
      endTime: slot.endTime
    });
  }

  for (const [weekday, slots] of slotsByDay.entries()) {
    for (let i = 0; i < slots.length; i += 1) {
      for (let j = i + 1; j < slots.length; j += 1) {
        const first = slots[i];
        const second = slots[j];

        if (first.start < second.end && first.end > second.start) {
          return next(
            buildValidationError(
              `Overlapping slots on ${weekday}: ${first.startTime}-${first.endTime} ` +
                `conflicts with ${second.startTime}-${second.endTime}`
            )
          );
        }
      }
    }
  }

  return next();
});

const Availability = mongoose.model("Availability", availabilitySchema);

export default Availability;
