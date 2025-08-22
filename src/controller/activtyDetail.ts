// controller/activtyDetail.ts
import { Response } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/database";
import { authenticateToken, AuthRequest } from "../middleware/auth";

// ✅ เพิ่มกิจกรรม (ใช้ uid จาก token)
export const addActivityDetail = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid; // ได้จาก authenticateToken
  const { act_id, goal, unit, round, message, time_remind } = req.body;

  if (!uid || !act_id || goal === undefined || !unit || round === undefined || !message) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const timeRemindJson = JSON.stringify(time_remind ?? []); // ["08:00","12:30"]

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO activity_detail
         (uid, act_id, goal, unit, round, message, time_remind)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uid, act_id, goal, unit, round, message, timeRemindJson]
    );

    return res.status(201).json({
      message: "Activity detail added successfully",
      act_detail_id: result.insertId,
    });
  } catch (error) {
    console.error("Error inserting activity detail:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ ลบ (ลบได้เฉพาะของตัวเอง)
export const deleteActivityDetail = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid;
  const { act_detail_id } = req.params;

  if (!uid) return res.status(401).json({ message: "Unauthorized" });

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `DELETE FROM activity_detail WHERE act_detail_id = ? AND uid = ?`,
      [act_detail_id, uid]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Activity detail not found" });
    }

    return res.status(200).json({ message: "Activity detail deleted successfully" });
  } catch (error) {
    console.error("Error deleting activity detail:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ รายการ “ของฉัน” เท่านั้น
export const getMyActivityDetails = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ message: "Unauthorized" });

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM activity_detail WHERE uid = ?`,
      [uid]
    );
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching activity details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ ดูรายละเอียด 1 รายการ (ของฉันเท่านั้น)
export const getActivityDetailById = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid;
  const { act_detail_id } = req.params;

  if (!uid) return res.status(401).json({ message: "Unauthorized" });

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM activity_detail WHERE act_detail_id = ? AND uid = ?`,
      [act_detail_id, uid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Activity detail not found" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching activity detail:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ ตั้งค่า current_value แบบ absolute (ของฉันเท่านั้น)
export const updateCurrentValue = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid;
  const { act_detail_id } = req.params;
  const { current_value } = req.body;

  if (!uid) return res.status(401).json({ message: "Unauthorized" });

  const newVal = Number(current_value);
  if (Number.isNaN(newVal) || newVal < 0) {
    return res.status(400).json({ message: "current_value invalid" });
  }

  try {
    // ดึง goal ของฉัน
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT goal FROM activity_detail WHERE act_detail_id = ? AND uid = ?`,
      [act_detail_id, uid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Activity detail not found" });
    }

    const rawGoal = rows[0].goal;
    const goal = rawGoal == null ? null : Number(rawGoal);
    const capped = goal != null && goal > 0 ? Math.min(newVal, goal) : newVal;

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE activity_detail SET current_value = ? WHERE act_detail_id = ? AND uid = ?`,
      [capped, act_detail_id, uid]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Activity detail not found" });
    }

    const [after] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM activity_detail WHERE act_detail_id = ? AND uid = ?`,
      [act_detail_id, uid]
    );

    return res.status(200).json(after[0]);
  } catch (error) {
    console.error("Error updating current_value:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ เพิ่มค่าแบบก้อน (ของฉันเท่านั้น)
export const increaseCurrentValue = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid;
  const { act_detail_id } = req.params;
  const { amount } = req.body;

  if (!uid) return res.status(401).json({ message: "Unauthorized" });

  const inc = Number(amount);
  if (Number.isNaN(inc) || inc <= 0) {
    return res.status(400).json({ message: "amount must be a positive number" });
  }

  try {
    // ดึง current & goal ของฉัน
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT current_value, goal FROM activity_detail WHERE act_detail_id = ? AND uid = ?`,
      [act_detail_id, uid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Activity detail not found" });
    }

    const current = Number(rows[0].current_value) || 0;
    const rawGoal = rows[0].goal;
    const goal = rawGoal == null ? null : Number(rawGoal);

    const proposed = current + inc;
    const next = goal != null && goal > 0 ? Math.min(proposed, goal) : proposed;

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE activity_detail SET current_value = ? WHERE act_detail_id = ? AND uid = ?`,
      [next, act_detail_id, uid]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Activity detail not found" });
    }

    const [after] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM activity_detail WHERE act_detail_id = ? AND uid = ?`,
      [act_detail_id, uid]
    );

    return res.status(200).json(after[0]);
  } catch (error) {
    console.error("Error increasing current_value:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
