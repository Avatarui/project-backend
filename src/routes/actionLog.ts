import { Router } from "express";
import { authenticateToken } from "../middlewares/auth";
import { getActionLogById, getLatestTargets } from "../controllers/actionlogController";

const router = Router();
router.use(authenticateToken);
router.get("/getChaningstatus", getLatestTargets);
// ✅ เพิ่มพารามิเตอร์ไว้ท้าย path
router.get("/getDetaillog/:actionId", getActionLogById);
export default router;