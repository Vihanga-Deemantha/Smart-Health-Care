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
    throw new AppError(
      "Cloudinary credentials are missing",
      500,
      "CLOUDINARY_CONFIG_MISSING"
    );
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });

  cloudinaryConfigured = true;
};

export const uploadReportBuffer = async ({ buffer, filename }) => {
  ensureCloudinaryConfig();

  const publicId = `${Date.now()}-${sanitizeName(filename || "report")}`;

  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_REPORTS_FOLDER || "smart-health/patient-reports",
        resource_type: "auto",
        public_id: publicId
      },
      (error, result) => {
        if (error) {
          reject(new AppError("Failed to upload report", 502, "REPORT_UPLOAD_FAILED", error));
          return;
        }

        resolve(result);
      }
    );

    Readable.from(buffer).pipe(stream);
  });
};
