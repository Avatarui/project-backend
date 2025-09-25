import { Router } from "express";
import {
  createExpectation,
  getExpectationsByUser,
  
} from "../controllers/expectationController";
import { validateCreateExpectation, validateGetExpectation } from "../middlewares/validations/expectation.validation";
import { authenticateToken } from "../middlewares/auth";

const router = Router();
router.use(authenticateToken);

// สร้าง expectation
router.post("/createexp", validateCreateExpectation,createExpectation);

// ดึง expectation ตาม uid
router.get("/getuidex",validateGetExpectation, getExpectationsByUser);
export default router;
