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

export const uploadReportBuffer = async ({ buffer, filename, mimeType = "" }) => {
  ensureCloudinaryConfig();

  const publicId = `${Date.now()}-${sanitizeName(filename || "report")}`;
  const extension = (filename || "").toLowerCase().split(".").pop() || "";
  const nonImageExtensions = new Set(["pdf", "doc", "docx", "txt"]);
  const nonImageMimeTypes = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
  ]);
  const resourceType =
    nonImageExtensions.has(extension) || nonImageMimeTypes.has(String(mimeType).toLowerCase())
      ? "raw"
      : "auto";

  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_REPORTS_FOLDER || "smart-health/patient-reports",
        resource_type: resourceType,
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

const destroyCloudinaryAsset = async ({ publicId, resourceType }) => {
  return await new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: resourceType,
        invalidate: true
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );
  });
};

export const deleteReportByPublicId = async ({ publicId, resourceType = null }) => {
  ensureCloudinaryConfig();

  const resourceTypes = resourceType ? [resourceType] : ["image", "raw", "video"];
  let notFoundCount = 0;
  let lastFailure = null;

  for (const currentType of resourceTypes) {
    try {
      const result = await destroyCloudinaryAsset({
        publicId,
        resourceType: currentType
      });

      if (result?.result === "ok") {
        return result;
      }

      if (result?.result === "not found") {
        notFoundCount += 1;
        continue;
      }

      lastFailure = result;
    } catch (error) {
      lastFailure = error;
    }
  }

  if (notFoundCount === resourceTypes.length) {
    return { result: "not found" };
  }

  throw new AppError(
    "Failed to delete report from storage",
    502,
    "REPORT_DELETE_FAILED",
    lastFailure
  );
};
