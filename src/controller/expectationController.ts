import { Request, Response } from "express";
import pool from "../config/database";

// ✅ CREATE: เพิ่ม expectation ใหม่
export const createExpectation = async (req: Request, res: Response) => {
  const { act_id, uid, user_exp, percentage_exp } = req.body;

  if (!act_id || !uid || !user_exp || percentage_exp == null) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    await pool.execute(
      "INSERT INTO expectation (act_id, uid, user_exp, percentage_exp) VALUES (?, ?, ?, ?)",
      [act_id, uid, user_exp, percentage_exp]
    );
    res.status(200).json({ message: "Expectation created successfully" });
  } catch (error) {
    console.error("Error creating expectation:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// ✅ READ: ดึงข้อมูล expectation ทั้งหมดของผู้ใช้
export const getExpectationsByUser = async (req: Request, res: Response) => {
  const uid = req.query.uid as string;

  if (!uid) {
    return res.status(400).json({ message: "Missing uid" });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM expectation WHERE uid = ?",
      [uid]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching expectations:", error);
    res.status(500).json({ message: "Database error" });
  }
};

