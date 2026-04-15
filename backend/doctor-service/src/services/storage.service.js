import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import AppError from "../utils/AppError.js";

let cloudinaryConfigured = false;

const sanitizeName = (name) => {
  return name
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9_-]/g, "_")
    .slice(0, 60);
};

const ensureCloudinaryConfig = () => {
  if (cloudinaryConfigured) {
    return;
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new AppError("Cloudinary credentials are missing", 500, "CLOUDINARY_CONFIG_MISSING");
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });

  cloudinaryConfigured = true;
};

const uploadBuffer = ({ buffer, filename, folder, resourceType, transformation }) => {
  ensureCloudinaryConfig();

  const publicId = `${Date.now()}-${sanitizeName(filename || "doctor-upload")}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: publicId,
        transformation
      },
      (error, result) => {
        if (error) {
          reject(
            new AppError("File upload failed", 502, "CLOUDINARY_UPLOAD_FAILED", error)
          );
          return;
        }

        resolve(result);
      }
    );

    Readable.from(buffer).pipe(stream);
  });
};

export const uploadQualificationDocumentBuffer = async ({ buffer, filename }) => {
  const folder = process.env.CLOUDINARY_DOCTOR_DOCUMENTS_FOLDER || "smart-health/doctor-qualifications";

  return uploadBuffer({
    buffer,
    filename,
    folder,
    resourceType: "auto"
  });
};

export const uploadDoctorProfilePhotoBuffer = async ({ buffer, filename }) => {
  const folder =
    process.env.CLOUDINARY_DOCTOR_PROFILE_PHOTOS_FOLDER ||
    "smart-health/doctor-profile-photos";

  return uploadBuffer({
    buffer,
    filename,
    folder,
    resourceType: "image",
    transformation: [
      {
        width: 512,
        height: 512,
        crop: "fill",
        gravity: "face"
      }
    ]
  });
};
