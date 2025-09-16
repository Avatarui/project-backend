// routes/activityDetail.ts
import { Router } from "express";
import {
  addActivityDetail,
  deleteActivityDetail,
  getActivityDetailById,
  getMyActivityDetails,
  updateCurrentValue,
  increaseCurrentValue,
} from "../controllers/activityDetailController";
import { authenticateToken } from "../middlewares/auth";

const router = Router();
router.use(authenticateToken); // ต้องมี token ทุกเส้น
router.post("/addActivityDetail", addActivityDetail);
router.get("/getMyActivityDetails", getMyActivityDetails);
router.get("/getActivityDetailById", getActivityDetailById); // query: ?act_detail_id=...
router.patch("/updateCurrentValue", updateCurrentValue); // query: ?act_detail_id=...
router.post("/increaseCurrentValue", increaseCurrentValue); // query: ?act_detail_id=...
router.delete("/deleteActivityDetail", deleteActivityDetail); // query: ?act_detail_id=...

export default router;
