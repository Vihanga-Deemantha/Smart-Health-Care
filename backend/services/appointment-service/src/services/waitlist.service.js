import Waitlist from "../models/Waitlist.js";
import AppError from "../utils/AppError.js";

export const joinWaitlist = async ({ doctorId, patientId, mode, preferredFrom, preferredTo, priority = 0 }) => {
  const existing = await Waitlist.findOne({
    doctorId,
    patientId,
    mode,
    status: "ACTIVE",
    preferredFrom: { $lte: new Date(preferredTo) },
    preferredTo: { $gte: new Date(preferredFrom) }
  });

  if (existing) {
    throw new AppError("You are already on a matching waitlist", 409, "WAITLIST_DUPLICATE");
  }

  return Waitlist.create({
    doctorId,
    patientId,
    mode,
    preferredFrom,
    preferredTo,
    priority
  });
};
