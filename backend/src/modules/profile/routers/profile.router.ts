import { Router } from "express";
import {
  getMyProfile,
  patchMyProfile,
  uploadPhoto,
  createStat,
  patchStat,
  removeStat,
} from "../controllers/profile.controller";
import { requireAuth } from "../../../middlewares/auth";
import { uploadImage } from "../../../lib/upload";
import { httpError } from "../../../lib/http";

const router = Router();

// A profile is the logged-in user's own data: require authentication.
router.use(requireAuth);

router.get("/", getMyProfile);
router.patch("/", patchMyProfile);

// Run multer, normalizing its errors (e.g. file-too-large) to 400s.
router.post(
  "/photo",
  (req, res, next) =>
    uploadImage(req, res, (err: unknown) => {
      if (err) {
        const e = err as { status?: number; message?: string };
        return next(e.status ? e : httpError(400, e.message ?? "Upload failed"));
      }
      next();
    }),
  uploadPhoto
);

router.post("/stats", createStat);
router.patch("/stats/:id", patchStat);
router.delete("/stats/:id", removeStat);

export default router;
