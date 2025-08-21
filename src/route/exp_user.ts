import { Router } from "express";
import {
  createExpectation,
  getExpectationsByUser,
  
} from "../controller/expectationController";

const router = Router();

// สร้าง expectation
router.post("/createexp", createExpectation);

// ดึง expectation ตาม uid
router.get("/getuidex", getExpectationsByUser);



export default router;
