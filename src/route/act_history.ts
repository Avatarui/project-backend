import { Router } from "express";
import { addActivityHistory } from "../controller/activityHistoryController";
const router = Router();

router.post("/act_history", addActivityHistory);
export default router;
