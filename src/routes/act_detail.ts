// routes/activityDetail.ts
import { Router } from "express";
import {
  addActivityDetail,
  deleteActivityDetail,
  getActData,
  getActivityDetailById,
  getOverallPercentController,
  getMyActivityDetails,
  getHistory,
  getDailyPercentAllController,
  
} from "../controllers/activityDetailController";
import { authenticateToken } from "../middlewares/auth";

const router = Router();
router.use(authenticateToken); 
router.post("/addActivityDetail", addActivityDetail);
router.get("/getMyActivityDetails", getMyActivityDetails);
router.get("/getActivityDetailById", getActivityDetailById); 
router.delete("/deleteActivityDetail", deleteActivityDetail); 
router.get('/daily-overall-percent', getOverallPercentController);
router.get("/getActData", getActData); 
router.get("/getHistory",getHistory);
router.get('/dailyPercentAll', getDailyPercentAllController);
export default router;
