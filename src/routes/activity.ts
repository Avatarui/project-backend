import { Router } from "express";
import multer from "multer";
import {
  createActivity,
  deleteActivity,
  getActivities,
  updateActivity,
} from "../controllers/activityController";
import { authenticateToken } from "../middlewares/auth";
const upload = multer({
  storage: multer.memoryStorage(), // เก็บไฟล์ใน RAM ชั่วคราว
  limits: { fileSize: 5 * 1024 * 1024 }, // ขนาดสูงสุด 5MB
});
const router = Router();

router.get("/getAct", authenticateToken,getActivities);
router.post("/createAct", upload.single("cateImage"), createActivity);
router.put("/updateAct", updateActivity);
router.post("/deleteAct", deleteActivity);
export default router;
