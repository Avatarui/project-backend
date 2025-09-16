import { Router } from "express";
import { addActivityHistory } from "../controllers/activityHistoryController";
import { authenticateToken } from "../middlewares/auth";
const router = Router();

router.post("/act_history", authenticateToken, addActivityHistory);
export default router;
