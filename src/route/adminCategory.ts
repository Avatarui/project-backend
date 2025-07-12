import { Router } from "express";
import multer from "multer";
import {
  addDefaultCategory,
  getDefaultCategories,
  deleteDefaultCategory,
  updateDefaultCategory,
} from "../controller/adminCategoryController";
const upload = multer({
  storage: multer.memoryStorage(), // เก็บไฟล์ใน RAM ชั่วคราว
  limits: { fileSize: 5 * 1024 * 1024 }, // ขนาดสูงสุด 5MB
});
const router = Router();

router.post(
  "/addDefaultCategory",
  upload.single("cateImage"), // multer middleware รับไฟล์
  addDefaultCategory // controller ที่แก้ไขแล้ว
);
router.get(
  "/getDefaultCategories",
  getDefaultCategories // controller ที่แก้ไขแล้ว
);
router.post("/deleteDefaultCategory", deleteDefaultCategory);
router.put(
  "/updateDefaultCategory",
  //   upload.single("cateImage"), // multer middleware รับไฟล์
  updateDefaultCategory // controller ที่แก้ไขแล้ว
);

export default router;
