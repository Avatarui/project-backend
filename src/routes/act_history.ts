import { Router } from "express";
import { addActivityHistory, increaseCurrentValue, updateLatestAction, getTodaySum} from "../controllers/activityHistoryController";
import { authenticateToken } from "../middlewares/auth";
import { getTodayCurrentValue } from "../controllers/activityDetailController";

const router = Router();

// เพิ่ม history โดยตรง (admin หรือ member ตัวเอง)
router.post("/act_history", authenticateToken, addActivityHistory);

// เพิ่มค่า action + คำนวณ progress วันนี้
router.post("/increaseCurrentValue", authenticateToken, increaseCurrentValue);
router.put("/updateCurrentValue", updateLatestAction); // query: ?act_detail_id=...
router.get("/getTodaySum", authenticateToken, getTodaySum); // query: ?act_detail_id=...
router.get("/getCurrentValue", getTodayCurrentValue );

export default router;
