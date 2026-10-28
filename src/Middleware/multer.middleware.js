import multer from "multer";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { BadRequestError } from "../Common/Errors/index.js";
import { PROFILE_DIR } from "../Utils/files.utils.js";

const MIME_TO_EXT = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

const fileFilter = (req, file, cb) => {
  if (!MIME_TO_EXT[file.mimetype]) {
    return cb(new BadRequestError("Only JPEG, PNG or WEBP images are allowed"));
  }
  cb(null, true);
};

// Local: saved on disk under /uploads/profile with a random name.
// The extension comes from the mimetype, never from the client-supplied filename.
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(PROFILE_DIR, { recursive: true });
    cb(null, PROFILE_DIR);
  },
  filename: (req, file, cb) => cb(null, `${randomUUID()}${MIME_TO_EXT[file.mimetype]}`)
});

export const localUpload = multer({ storage: localStorage, fileFilter, limits: { fileSize: MAX_SIZE } });

// Cloud: kept in memory, then streamed to Cloudinary by the service.
export const cloudUpload = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: MAX_SIZE } });
