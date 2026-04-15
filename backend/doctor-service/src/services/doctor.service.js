import Doctor from "../models/doctor.model.js";
import Availability from "../models/Availability.js";
import AppError from "../utils/AppError.js";

const buildDoctorFilters = (filters = {}) => {
  const query = {};

  if (filters.specialization) {
    query.specialties = {
      $regex: filters.specialization,
      $options: "i"
    };
  }

  if (filters.hospitalId || filters.hospital) {
    query.hospitalId = filters.hospitalId || filters.hospital;
  }

  if (filters.isAvailable !== undefined) {
    const value = String(filters.isAvailable).toLowerCase();
    if (value === "true" || value === "false") {
      query.isAvailable = value === "true";
    }
  }

  return query;
};

export const listDoctors = async (filters = {}) => {
  const query = buildDoctorFilters(filters);
  return Doctor.find(query).lean();
};

export const listInternalDoctors = async (filters = {}) => {
  const query = buildDoctorFilters(filters);
  return Doctor.find(query).lean();
};

export const getDoctorById = async (doctorId) => {
  return Doctor.findById(doctorId).lean();
};

export const getInternalDoctor = async (doctorId) => {
  return Doctor.findById(doctorId).lean();
};

export const createDoctor = async (payload) => {
  const doctor = new Doctor(payload);
  return doctor.save();
};

export const updateDoctorAvailability = async ({ doctorId, availability, actorUserId }) => {
  const doctor = await Doctor.findById(doctorId);

  if (!doctor) {
    throw new AppError("Doctor not found", 404, "NOT_FOUND");
  }

  if (actorUserId && String(doctor.userId) !== String(actorUserId)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  const doctorAvailability = availability.map((rule) => ({
    weekday: rule.weekday,
    startHour: rule.startHour,
    endHour: rule.endHour,
    slotDurationMinutes: rule.slotDurationMinutes
  }));

  doctor.availability = doctorAvailability;
  await doctor.save();

  await Availability.deleteMany({ doctorId: doctor._id.toString() });

  const availabilityDocs = availability.map((rule) => ({
    doctorId: doctor._id.toString(),
    hospitalId: doctor.hospitalId || null,
    weekday: rule.weekday,
    startHour: rule.startHour,
    endHour: rule.endHour,
    slotDurationMinutes: rule.slotDurationMinutes,
    bufferMinutes: Number(rule.bufferMinutes || 0),
    mode: rule.mode,
    timezone: rule.timezone || "UTC",
    active: typeof rule.active === "boolean" ? rule.active : true
  }));

  if (availabilityDocs.length) {
    await Availability.insertMany(availabilityDocs);
  }

  return doctor.toObject({ versionKey: false });
};

export const updateDoctorProfile = async ({ doctorId, payload, actorUserId }) => {
  const doctor = await Doctor.findById(doctorId);

  if (!doctor) {
    throw new AppError("Doctor not found", 404, "NOT_FOUND");
  }

  if (actorUserId && String(doctor.userId) !== String(actorUserId)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  if (payload.hospitalId !== undefined) {
    doctor.hospitalId = payload.hospitalId || null;
  }

  if (payload.contactNumber !== undefined) {
    doctor.contactNumber = payload.contactNumber || null;
  }

  if (payload.consultationFee !== undefined) {
    doctor.consultationFee = payload.consultationFee;
  }

  if (payload.specialties !== undefined) {
    doctor.specialties = payload.specialties || [];
  }

  if (payload.bio !== undefined) {
    doctor.bio = payload.bio || null;
  }

  if (payload.licenseNumber !== undefined) {
    doctor.licenseNumber = payload.licenseNumber;
  }

  if (payload.isAvailable !== undefined) {
    doctor.isAvailable = payload.isAvailable;
  }

  if (payload.qualifications !== undefined) {
    doctor.qualifications = payload.qualifications || [];
  }

  await doctor.save();

  return doctor.toObject({ versionKey: false });
};
