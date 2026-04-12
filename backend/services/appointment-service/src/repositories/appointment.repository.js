import Appointment from "../models/Appointment.js";

export const findAppointmentById = (id) => Appointment.findById(id);

export const findDoctorSlotConflict = ({ doctorId, startTime, excludeId = null }) => {
  const query = {
    doctorId,
    startTime
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return Appointment.findOne(query);
};
