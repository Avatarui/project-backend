import { Router } from "express";
import {
  createExpectation,
  getExpectationsByUser,
  checkExpectationByActId
} from "../controllers/expectationController";
import { validateCreateExpectation, validateGetExpectation } from "../middlewares/validations/expectation.validation";
import { authenticateToken } from "../middlewares/auth";

const router = Router();
router.use(authenticateToken);

// สร้าง expectation
router.post("/createexp", validateCreateExpectation,createExpectation);

// ดึง expectation ตาม uid
router.get("/getuidex",validateGetExpectation, getExpectationsByUser);
router.post("/check", checkExpectationByActId);
export default router;
