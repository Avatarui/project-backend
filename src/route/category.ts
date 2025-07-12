import { Router } from "express";
import multer from "multer";
import {
  createCategory,
  deleteCategory,
  getCategory,
  updateCategory,
} from "../controller/categoryController";
const upload = multer({
  storage: multer.memoryStorage(), // เก็บไฟล์ใน RAM ชั่วคราว
  limits: { fileSize: 5 * 1024 * 1024 }, // ขนาดสูงสุด 5MB
});
const router = Router();
router.post(
  "/createCate",
  upload.single("cateImage"), // multer middleware รับไฟล์
  createCategory // controller ที่แก้ไขแล้ว
);
router.get(
  "/getCategory",
  getCategory // controller ที่แก้ไขแล้ว
);

router.post("/deleteCategory", deleteCategory);

router.put("/updateCategory", updateCategory);

export default router;
