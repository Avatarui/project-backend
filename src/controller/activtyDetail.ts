import { Request, Response, NextFunction } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/database";
export const addActivityDetail = async (req: Request, res: Response) => {
  const { uid, act_id, goal, unit, round, message, time_remind } = req.body;

  // เช็คค่าว่าง
  if (!uid || !act_id || !goal || !unit || !round || !message || !time_remind) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // แปลง time_remind เป็น JSON string ถ้ายังไม่เป็น
    const timeRemindJson = JSON.stringify(time_remind); // ต้องเป็น array เช่น ["08:00", "12:30"]

    const [result] = await pool.execute(
      `INSERT INTO activity_detail 
        (uid, act_id, goal, unit, round, message, time_remind)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uid, act_id, goal, unit, round, message, timeRemindJson]
    );

    res
      .status(201)
      .json({ message: "Activity detail added successfully", result });
  } catch (error) {
    console.error("Error inserting activity detail:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const deleteActivityDetail = async (req: Request, res: Response) => {
  const { act_detail_id } = req.params;

  try {
    const [result] = await pool.execute(
      `DELETE FROM activity_detail WHERE act_detail_id = ?`,
      [act_detail_id]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: "Activity detail not found" });
    }

    res.status(200).json({ message: "Activity detail deleted successfully" });
  } catch (error) {
    console.error("Error deleting activity detail:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllActivityDetails = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute(`SELECT * FROM activity_detail`);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching activity details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getActivityDetailById = async (req: Request, res: Response) => {
  const { act_detail_id } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT * FROM activity_detail WHERE act_detail_id = ?`,
      [act_detail_id]
    );

    const data = rows as any[];

    if (data.length === 0) {
      return res.status(404).json({ message: "Activity detail not found" });
    }

    res.status(200).json(data[0]);
  } catch (error) {
    console.error("Error fetching activity detail:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const updateCurrentValue = async (req: Request, res: Response) => {
  const { act_detail_id } = req.params;
  const { current_value } = req.body;

  if (current_value === undefined || current_value === null) {
    return res.status(400).json({ message: "current_value is required" });
  }

  try {
    // ดึง goal ก่อน
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT goal FROM activity_detail WHERE act_detail_id = ?",
      [act_detail_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Activity detail not found" });
    }

    const goal = Number(rows[0].goal) || 0;
    const capped = Math.min(Number(current_value), goal);

    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE activity_detail SET current_value = ? WHERE act_detail_id = ?",
      [capped, act_detail_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Activity detail not found" });
    }

    // ดึงข้อมูลล่าสุดกลับมา
    const [after] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM activity_detail WHERE act_detail_id = ?",
      [act_detail_id]
    );

    return res.status(200).json(after[0]);
  } catch (error) {
    console.error("Error updating current_value:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const increaseCurrentValue = async (req: Request, res: Response) => {
  const { act_detail_id } = req.params;
  const { amount } = req.body;

  if (amount === undefined || amount === null) {
    return res.status(400).json({ message: "amount is required" });
  }
  const inc = Number(amount);
  if (Number.isNaN(inc) || inc <= 0) {
    return res
      .status(400)
      .json({ message: "amount must be a positive number" });
  }

  try {
    // 1) SELECT current_value & goal (ระบุ generic เป็น RowDataPacket[])
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT current_value, goal FROM activity_detail WHERE act_detail_id = ?",
      [act_detail_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Activity detail not found" });
    }

    const current = Number((rows[0] as any).current_value) || 0;
    const goal = Number((rows[0] as any).goal) || 0;

    const next = Math.min(current + inc, goal);

    // 2) UPDATE (ระบุ generic เป็น ResultSetHeader)
    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE activity_detail SET current_value = ? WHERE act_detail_id = ?",
      [next, act_detail_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Activity detail not found" });
    }

    // 3) SELECT กลับมาอีกครั้ง (RowDataPacket[])
    const [after] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM activity_detail WHERE act_detail_id = ?",
      [act_detail_id]
    );

    return res.status(200).json(after[0]);
  } catch (error) {
    console.error("Error increasing current_value:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
