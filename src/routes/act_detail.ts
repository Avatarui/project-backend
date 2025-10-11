// routes/activityDetail.ts
import { Router } from "express";
import {
  addActivityDetail,
  deleteActivityDetail,
  getActData,
  getActivityDetailById,
  getDailyOverallPercentController,
  getMyActivityDetails,
  
} from "../controllers/activityDetailController";
import { authenticateToken } from "../middlewares/auth";

const router = Router();
router.use(authenticateToken); 
router.post("/addActivityDetail", addActivityDetail);
router.get("/getMyActivityDetails", getMyActivityDetails);
router.get("/getActivityDetailById", getActivityDetailById); // query: ?act_detail_id=...
router.delete("/deleteActivityDetail", deleteActivityDetail); // query: ?act_detail_id=...
router.get('/daily-overall-percent', getDailyOverallPercentController);
router.get("/getActData", getActData); // query: ?act_id=...
export default router;
