import { Router } from "express";
import multer from "multer";
import {
  countActivities,
  createActivity,
  deleteActivity,
  getActivities,
  getActivitySummary,
  updateActivity,
} from "../controllers/activityController";
import { authenticateToken } from "../middlewares/auth";
import path from "path";
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads")); // โฟลเดอร์ uploads
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
const router = Router();

router.get("/getAct", authenticateToken, getActivities);
router.post("/createAct", authenticateToken, createActivity);
// router.post("/createAct", upload.single("act_pic"), createActivity);
router.put("/updateAct", authenticateToken, updateActivity);
router.post("/deleteAct", authenticateToken, deleteActivity);
router.get("/count", authenticateToken, countActivities); // /api/activity/count
router.get("/summary", authenticateToken, getActivitySummary); // /api/activity/summary
export default router;
