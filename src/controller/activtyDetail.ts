import { Request, Response, NextFunction } from "express";
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