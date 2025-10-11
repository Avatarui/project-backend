import { Router } from "express";
import multer from "multer";
import {
  addCategory,
  deleteCategory,
  getCategory,
  getDefaultCategories,
  updateCategory,
} from "../controllers/categoryController";
import { authenticateToken, requireAdmin } from "../middlewares/auth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const router = Router();

// Member: ดู category
router.get("/getCategory", authenticateToken, getCategory);

// Admin: สร้าง category
router.post(
  "/addDefaultCategory",
  authenticateToken,
  requireAdmin,
  // upload.single("cateImage"),
  addCategory
);

// Admin: ดู default categories
router.get("/getDefaultCategories", authenticateToken, getDefaultCategories);


// Admin: ลบ category
router.post(
  "/deleteDefaultCategory",
  authenticateToken,
  requireAdmin,
  deleteCategory
);

// Admin: อัปเดต category
router.put(
  "/updateDefaultCategory",
  authenticateToken,
  requireAdmin,
  // ถ้าต้องการรองรับการอัปเดตรูป: เปิดคอมเมนต์บรรทัดถัดไป
  // upload.single("cateImage"),
  updateCategory
)

export default router;
