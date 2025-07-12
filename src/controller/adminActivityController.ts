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
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM activity WHERE uid = ?",
      [defaultUid]
    );
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching default activities:", error);
    return res.status(500).json({ message: "Database error" });
  }
};

export const updateDefaultActivity = async (req: Request, res: Response) => {
  const { act_id, act_name, act_pic, cate_id } = req.body;

  if (!act_id || !act_name || !act_pic || !cate_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // ตรวจสอบ category ว่ายังมีอยู่สำหรับ uid = default
    const [categoryRows] = await pool.execute(
      "SELECT cate_id FROM category WHERE cate_id = ? AND uid = ?",
      [cate_id, defaultUid]
    );

    if ((categoryRows as any[]).length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    // ตรวจสอบ activity ว่ายังมีอยู่สำหรับ uid = default
    const [activityRows] = await pool.execute(
      "SELECT act_id FROM activity WHERE act_id = ? AND uid = ?",
      [act_id, defaultUid]
    );

    if ((activityRows as any[]).length === 0) {
      return res.status(404).json({ message: "Activity not found" });
    }

    await pool.execute(
      "UPDATE activity SET cate_id = ?, act_name = ?, act_pic = ? WHERE act_id = ? AND uid = ?",
      [cate_id, act_name, act_pic, act_id, defaultUid]
    );

    return res.status(200).json({ message: "Default activity updated successfully" });
  } catch (error) {
    console.error("Error updating default activity:", error);
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
