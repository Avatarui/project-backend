import { Router } from "express";
import {
  createExpectation,
  getExpectationsByUser,
  
} from "../controllers/expectationController";
import { validateCreateExpectation, validateGetExpectation } from "../middlewares/validations/expectation.validation";

const router = Router();

// สร้าง expectation
router.post("/createexp", validateCreateExpectation,createExpectation);

// ดึง expectation ตาม uid
router.get("/getuidex",validateGetExpectation, getExpectationsByUser);
export default router;
