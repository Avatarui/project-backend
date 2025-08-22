// route/act_detail.ts
import { Router } from "express";
import {
  addActivityDetail,
  deleteActivityDetail,
  getActivityDetailById,
  getMyActivityDetails,
  updateCurrentValue,
  increaseCurrentValue,
} from "../controller/activtyDetail";
import { authenticateToken } from "../middleware/auth";

const router = Router();
router.use(authenticateToken); // ต้องมี token ทุกเส้น

router.post("/addActivityDetail", addActivityDetail);
router.get("/activity-detail", getMyActivityDetails);
router.get("/activity-detail/:act_detail_id", getActivityDetailById);
router.patch("/activity-detail/:act_detail_id/current", updateCurrentValue);
router.post("/activity-detail/:act_detail_id/increase", increaseCurrentValue);
router.delete("/activity-detail/:act_detail_id", deleteActivityDetail);

export default router;
