// src/controllers/usersController.ts

import { Request, Response } from "express";
import pool from "../config/database";
import { ResultSetHeader } from "mysql2";

// ---------------------------
// Member functionalities (Combined)
// ---------------------------

/**
 * Allows a member to edit their user information (username, profile picture, birthday).
 * The function will update any field that is provided in the request body.
 */
export const editUserInfo = async (req: Request, res: Response) => {
  try {
    const { uid, username, photo_url, birthday } = req.body;

    // ต้องมี uid เพื่อระบุตัวตนผู้ใช้
    if (!uid) {
      return res.status(400).json({ success: false, message: "Missing required field: uid." });
    }

    // สร้าง array เพื่อเก็บค่าที่จะใช้ใน SQL query และ array เพื่อเก็บเงื่อนไข SET
    const updates = [];
    const updateValues = [];

    if (username) {
      updates.push("username = ?");
      updateValues.push(username);
    }

    if (photo_url) {
      updates.push("photo_url = ?");
      updateValues.push(photo_url);
    }

    if (birthday) {
      updates.push("birthday = ?");
      updateValues.push(birthday);
    }

    // ถ้าไม่มีข้อมูลที่ต้องการอัปเดต
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "No fields provided for update." });
    }

    // รวมเงื่อนไข SET เข้าด้วยกันด้วย ','
    const updateClause = updates.join(", ");

    // สร้างคำสั่ง SQL
    const sql = `
      UPDATE users
      SET ${updateClause}
      WHERE uid = ?;
    `;

    // เพิ่ม uid ลงใน array ของค่าที่จะส่งให้ query
    updateValues.push(uid);

    const [result] = await pool.execute(sql, updateValues) as [ResultSetHeader, any];

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User not found or no changes were made." });
    }

    return res.status(200).json({ success: true, message: "User information updated successfully." });

  } catch (error) {
    console.error("Error updating user info:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};


// ---------------------------
// Admin functionality
// ---------------------------

/**
 * Allows an admin to change a user's status.
 */
export const changeStatus = async (req: Request, res: Response) => {
  try {
    const { uid, status } = req.body;

    if (!uid || !status) {
      return res.status(400).json({ success: false, message: "Missing required fields: uid and status." });
    }

    const validStatuses = ['active', 'suspended', 'deleted'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value. Must be 'active', 'suspended', or 'deleted'." });
    }

    const sql = `
      UPDATE users
      SET status = ?
      WHERE uid = ?;
    `;

    const [result] = await pool.execute(sql, [status, uid]) as [ResultSetHeader, any];

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User not found or status is the same." });
    }

    return res.status(200).json({ success: true, message: `User status updated to '${status}' successfully.` });

  } catch (error) {
    console.error("Error changing user status:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};