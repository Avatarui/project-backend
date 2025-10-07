import { Router } from "express";
import { addActivityHistory, increaseCurrentValue, updateLatestAction, getTodaySum, getDailyPercent} from "../controllers/activityHistoryController";
import { authenticateToken } from "../middlewares/auth";
import { getTodayCurrentValue } from "../controllers/activityDetailController";

const router = Router();

router.post("/act_history", authenticateToken, addActivityHistory);
router.post("/increaseCurrentValue", authenticateToken, increaseCurrentValue);
router.put("/updateCurrentValue", updateLatestAction);
router.get("/getTodaySum", authenticateToken, getTodaySum); 
router.get("/getCurrentValue", authenticateToken,getTodayCurrentValue );
router.get("/dailyPercent", authenticateToken, getDailyPercent);

export default router;