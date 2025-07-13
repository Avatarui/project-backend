import { Request, Response } from "express";
import pool from "../config/database";

const defaultUid = "default";

export const createDefaultActivity = async (req: Request, res: Response) => {
  const { cate_id, act_name, act_pic } = req.body;

  if (!cate_id || !act_name || !act_pic) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // ตรวจสอบว่า cate_id มีจริงในตาราง category สำหรับ uid = 'default'
    const [categoryRows] = await pool.execute(
      "SELECT cate_id FROM category WHERE cate_id = ? AND uid = ?",
      [cate_id, defaultUid]
    );

    if ((categoryRows as any[]).length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    await pool.execute(
      "INSERT INTO activity (uid, cate_id, act_name, act_pic) VALUES (?, ?, ?, ?)",
      [defaultUid, cate_id, act_name, act_pic]
    );

    return res.status(200).json({ message: "Default activity created successfully" });
  } catch (error) {
    console.error("Error inserting default activity:", error);
    return res.status(500).json({ message: "Database error" });
  }
};

export const getDefaultActivities = async (req: Request, res: Response) => {
  const cateId = req.query.cate_id as string | undefined;
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM activity WHERE uid = ? AND cate_id = ?",
      [defaultUid, cateId]
    );
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching default activities:", error);
    return res.status(500).json({ message: "Database error" });
  }
};

export const updateDefaultActivity = async (req: Request, res: Response) => {
const { uid, act_id, act_name, act_pic } = req.body;

  if (!uid || !act_id || !act_name || !act_pic) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // 🔍 ตรวจสอบว่า act_id มีอยู่จริงในตาราง activity ก่อน
    const [activityRows] = await pool.execute(
      "SELECT act_id FROM activity WHERE act_id = ? AND uid = ?",
      [act_id, defaultUid]
    );

    if ((activityRows as any[]).length === 0) {
      return res.status(404).json({ message: "Activity not found" });
    }

    // ✅ ถ้ามี activity จริง → ค่อยอัพเดท activity
    await pool.execute(
      "UPDATE activity SET act_name = ?, act_pic = ? WHERE uid = ? AND act_id = ?",
      [act_name, act_pic, defaultUid, act_id]
    );

    return res.status(200).json({ message: "Activity updated successfully" });
  } catch (error) {
    console.error("Error updating activity:", error);
    return res.status(500).json({ message: "Database error" });
  }
};


export const deleteDefaultActivity = async (req: Request, res: Response) => {
  const { act_id } = req.body;

  if (!act_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // ตรวจสอบ activity ว่ายังมีอยู่สำหรับ uid = default
    const [activityRows] = await pool.execute(
      "SELECT act_id FROM activity WHERE act_id = ? AND uid = ?",
      [act_id, defaultUid]
    );

    if ((activityRows as any[]).length === 0) {
      return res.status(404).json({ message: "Activity not found" });
    }

    await pool.execute(
      "DELETE FROM activity WHERE act_id = ? AND uid = ?",
      [act_id, defaultUid]
    );

    return res.status(200).json({ message: "Default activity deleted successfully" });
  } catch (error) {
    console.error("Error deleting default activity:", error);
    return res.status(500).json({ message: "Database error" });
  }
};
