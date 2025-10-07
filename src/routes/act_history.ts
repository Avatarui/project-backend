import { Router } from "express";
import { addActivityHistory, increaseCurrentValue, updateLatestAction, getTodaySum, getDailyPercent, getLatestActionValue} from "../controllers/activityHistoryController";
import { authenticateToken } from "../middlewares/auth";
import { getTodayCurrentValue } from "../controllers/activityDetailController";

const router = Router();

router.post("/act_history", authenticateToken, addActivityHistory);
router.post("/increaseCurrentValue", authenticateToken, increaseCurrentValue);
router.put("/updateCurrentValue",authenticateToken, updateLatestAction);
router.get("/getTodaySum", authenticateToken, getTodaySum); 
router.get("/getCurrentValue", authenticateToken,getTodayCurrentValue );
router.get("/dailyPercent", authenticateToken, getDailyPercent);
router.get("/latest", authenticateToken, getLatestActionValue);

export default router;