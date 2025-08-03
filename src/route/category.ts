import { Router } from "express";
import multer from "multer";
import { getCategory } from "../controller/categoryController";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, 
});
const router = Router();
router.get(
  "/getCategory",
  getCategory
);
export default router;
