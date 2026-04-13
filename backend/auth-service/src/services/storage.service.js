import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import AppError from "../utils/AppError.js";
import { extractVerificationDocumentPublicIds } from "../utils/doctorVerification.js";

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

export const uploadDoctorVerificationBuffer = async ({ buffer, filename }) => {
  ensureCloudinaryConfig();

  const publicId = `${Date.now()}-${sanitizeName(filename || "doctor-document")}`;

  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:
          process.env.CLOUDINARY_DOCTOR_DOCUMENTS_FOLDER ||
          "smart-health/doctor-verification",
        resource_type: "auto",
        public_id: publicId
      },
      (error, result) => {
        if (error) {
          reject(
            new AppError(
              "Failed to upload verification document",
              502,
              "VERIFICATION_UPLOAD_FAILED",
              error
            )
          );
          return;
        }

        resolve(result);
      }
    );

    Readable.from(buffer).pipe(stream);
  });
};

export const uploadAdminProfilePhotoBuffer = async ({ buffer, filename }) => {
  ensureCloudinaryConfig();

  const publicId = `${Date.now()}-${sanitizeName(filename || "admin-profile-photo")}`;

  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:
          process.env.CLOUDINARY_ADMIN_PROFILE_PHOTOS_FOLDER ||
          "smart-health/admin-profile-photos",
        resource_type: "image",
        public_id: publicId,
        transformation: [
          {
            width: 512,
            height: 512,
            crop: "fill",
            gravity: "face"
          }
        ]
      },
      (error, result) => {
        if (error) {
          reject(
            new AppError(
              "Failed to upload admin profile photo",
              502,
              "ADMIN_PROFILE_PHOTO_UPLOAD_FAILED",
              error
            )
          );
          return;
        }

        resolve(result);
      }
    );

    Readable.from(buffer).pipe(stream);
  });
};

const destroyDoctorVerificationResource = async (publicId, resourceType) => {
  return await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true
  });
};

export const deleteDoctorVerificationResourcesByPublicIds = async (publicIds = []) => {
  ensureCloudinaryConfig();

  for (const publicId of publicIds.filter(Boolean)) {
    let deleted = false;

    for (const resourceType of ["image", "raw", "video"]) {
      const result = await destroyDoctorVerificationResource(publicId, resourceType);

      if (result.result === "ok") {
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      console.warn(
        `[storage] verification document cleanup skipped for ${publicId}; resource not found`
      );
    }
  }
};

export const deleteDoctorVerificationDocuments = async (verificationDocuments = []) => {
  const publicIds = extractVerificationDocumentPublicIds(verificationDocuments);

  if (!publicIds.length) {
    return;
  }

  await deleteDoctorVerificationResourcesByPublicIds(publicIds);
};

export const deleteAdminProfilePhotoByPublicId = async (publicId) => {
  if (!publicId) {
    return;
  }

  ensureCloudinaryConfig();

  const result = await destroyDoctorVerificationResource(publicId, "image");

  if (result.result !== "ok" && result.result !== "not found") {
    console.warn(`[storage] admin profile photo cleanup skipped for ${publicId}`);
  }
};
