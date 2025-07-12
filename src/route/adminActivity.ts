import { Router } from "express";
import multer from "multer";
import {
  createDefaultActivity,
  getDefaultActivities,
  updateDefaultActivity,
  deleteDefaultActivity,
} from "../controller/adminActivityController";
const upload = multer({
  storage: multer.memoryStorage(), // เก็บไฟล์ใน RAM ชั่วคราว
  limits: { fileSize: 5 * 1024 * 1024 }, // ขนาดสูงสุด 5MB
});
const router = Router();
router.post(
  "/addDefaultActivity",
  upload.single("cateImage"), // multer middleware รับไฟล์
  createDefaultActivity // controller ที่แก้ไขแล้ว
);
router.get(
  "/getDefaultActivity",
  getDefaultActivities // controller ที่แก้ไขแล้ว
);
router.post("/deleteDefaultActivity", deleteDefaultActivity);
router.put(
  "/updateDefaultActivity",
  //   upload.single("cateImage"), // multer middleware รับไฟล์
  updateDefaultActivity // controller ที่แก้ไขแล้ว
);
export default router;