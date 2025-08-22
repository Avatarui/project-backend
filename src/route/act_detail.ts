import { Router } from "express";
import multer from "multer";
import {
  addActivityDetail,
  deleteActivityDetail,
  getActivityDetailById,
  getAllActivityDetails,
  updateCurrentValue,       // <-- เพิ่ม
  increaseCurrentValue, 
} from "../controller/activtyDetail";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
const router = Router();
router.post("/addActivityDetail", addActivityDetail);
router.delete("/activity-detail/:act_detail_id", deleteActivityDetail);
router.get("/activity-detail", getAllActivityDetails);
router.get("/activity-detail/:act_detail_id", getActivityDetailById);

router.patch("/activity-detail/:act_detail_id/current", updateCurrentValue);
router.post("/activity-detail/:act_detail_id/increase", increaseCurrentValue);


export default router;
