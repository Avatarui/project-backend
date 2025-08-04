import { Request, Response, Router } from "express";
import pool from "../config/database";
import { ResultSetHeader } from "mysql2"; // ยังคงต้องใช้ ResultSetHeader

export const sendReport = async (req: Request, res: Response) => {
  try {
    const { uid, report_detail } = req.body;

    // ตรวจสอบว่าข้อมูลที่จำเป็นถูกส่งมาครบหรือไม่
    if (!uid || !report_detail) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    // เตรียมคำสั่ง SQL สำหรับการ INSERT (โดยไม่ต้องมี create_at)
    const sql = `
      INSERT INTO report (uid, report_detail) 
      VALUES (?, ?)
    `;

    // ทำการ query ไปยัง database โดยส่งแค่ uid และ report_detail
    const [result] = (await pool.execute(sql, [uid, report_detail])) as [
      ResultSetHeader,
      any
    ];

    if ("insertId" in result) {
      return res.status(201).json({
        success: true,
        message: "Report sent successfully.",
        report_id: result.insertId,
      });
    } else {
      return res
        .status(500)
        .json({ success: false, message: "Failed to get insert ID." });
    }
  } catch (error) {
    console.error("Error sending report:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

export const getReport = async (req: Request, res: Response) => {
  try {
    const sql = `
      SELECT
        u.uid,
        u.username,
        u.email,
        r.report_id,
        r.report_detail,
        r.create_at
      FROM
        users u
      INNER JOIN
        report r ON u.uid = r.uid
      ORDER BY
        r.create_at DESC;
    `;

    // ทำการ query เพื่อดึงข้อมูลรายงานทั้งหมดที่เชื่อมโยงกับผู้ใช้
    const [rows] = await pool.execute(sql);

    // ส่งข้อมูลที่ได้กลับไปในรูปแบบ JSON
    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
