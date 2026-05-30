import multer from "multer";
import { extname } from "node:path";
import { createId } from "@paralleldrive/cuid2";
import { httpError } from "./http";
import { ChatBriefing } from "../modules/ai/types/ai.types";

// Where uploaded files live. Served publicly via app.use("/uploads", ...).
export const UPLOAD_DIR = "uploads";

const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  // cuid keeps every filename unique (no collisions, not guessable).
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `${createId()}${ext}`);
  },
});

/** Single-image upload under the `photo` field. Rejects non-images / >5MB. */
export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED.has(ext) || !file.mimetype.startsWith("image/")) {
      return cb(httpError(400, "Only image files (jpg, png, gif, webp) are allowed"));
    }
    cb(null, true);
  },
}).single("photo");
