import { Router } from "express";
import {
  getStats,
  createStat,
  patchStat,
  removeStat,
  calculate,
} from "../controllers/personal.controller";

const router = Router();

router.post("/calculate", calculate);

router.get("/stats", getStats);
router.post("/stats", createStat);
router.patch("/stats/:id", patchStat);
router.delete("/stats/:id", removeStat);

export default router;
