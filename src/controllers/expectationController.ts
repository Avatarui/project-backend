import { Request, Response } from "express";
import {
  createExpectationService,
  getExpectationsByUserService,
  checkExpectationDB,
  getExpectationsByActIdAndUser,
  updateExpectationService,
} from "../services/expectationService";
import { ExpectationBody } from "../types/expectation";
import { AuthRequest } from "../middlewares/auth";

// CREATE
export const createExpectation = async (req: Request, res: Response) => {
  const { act_id, uid, user_exp } = req.body as ExpectationBody;

  try {
    const exp_id = await createExpectationService({ act_id, uid, user_exp });
    res
      .status(200)
      .json({ message: "Expectation created successfully", exp_id });
  } catch (error) {
    console.error("Error creating expectation:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// READ
export const getExpectationsByUser = async (req: Request, res: Response) => {
  const uid = req.query.uid as string;
  const actId = req.query.act_id as string;

  if (!uid || !actId) {
    return res.status(400).json({ message: "uid and act_id are required" });
  }

  try {
    const rows = await getExpectationsByUserService(uid, actId);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching expectations:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// controllers/expectationController.ts
export const checkExpectationByActId = async (req: Request, res: Response) => {
  const { act_id, uid } = req.body;

  // ปริ้นค่าที่รับมา
  // console.log("Received in checkExpectationByActId:", req.body);

  if (!act_id || !uid) {
    return res.status(400).json({ message: "act_id and uid are required" });
  }

  try {
    // ตรวจสอบว่ามี expectation อยู่แล้วหรือไม่
    const exists = await checkExpectationDB(act_id, uid);

    let userExp = null;
    if (exists) {
      const expectations = await getExpectationsByActIdAndUser(act_id, uid);
      userExp = expectations?.user_exp || null;
    }

    return res.status(200).json({ exists, user_exp: userExp });
  } catch (error) {
    console.error("Error in checkExpectationByActId:", error);
    return res.status(500).json({ message: "Database error" });
  }
};

export const updateExpectation = async (req: AuthRequest, res: Response) => {
  const { act_id, user_exp } = req.body;
  const uid = req.user?.uid; // ✅ ดึง uid จาก token ที่ decode แล้ว

  if (!act_id || !uid || user_exp === undefined) {
    return res.status(400).json({ message: "act_id และ user_exp ต้องระบุ" });
  }

  try {
    const exists = await checkExpectationDB(act_id, uid);
    if (!exists) {
      return res
        .status(404)
        .json({ message: "ไม่พบ expectation ของผู้ใช้คนนี้" });
    }

    const updated = await updateExpectationService(act_id, uid, user_exp);

    if (updated) {
      const updatedData = await getExpectationsByActIdAndUser(act_id, uid);
      return res
        .status(200)
        .json({ message: "อัพเดทสำเร็จ", data: updatedData });
    } else {
      return res.status(500).json({ message: "อัพเดทไม่สำเร็จ" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
};
