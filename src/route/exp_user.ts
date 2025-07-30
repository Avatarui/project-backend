import { Router } from "express";
import {
  createExpectation,
  getExpectationsByUser,
  updateExpectation,
  deleteExpectation,
} from "../controller/expectationController";

const router = Router();

// สร้าง expectation
router.post("/create", createExpectation);

// ดึง expectation ตาม uid
router.get("/get", getExpectationsByUser);

// แก้ไข expectation
router.put("/update", updateExpectation);

// ลบ expectation
router.post("/delete", deleteExpectation);

export default router;
