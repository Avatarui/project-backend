import { RowDataPacket } from "mysql2";
import pool from "../config/database";
import { ActivityHistoryBody } from "../types/activityHistory.types";

export class ActivityHistoryService {
  // เพิ่ม history (ใช้เวลาที่ add แบบ manual)
  static async addHistory(history: ActivityHistoryBody) {
    const { act_detail_id, uid, action, value_done } = history;
    const [result] = await pool.execute(
      `INSERT INTO activity_history 
       (act_detail_id, uid, action, value_done, create_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [act_detail_id, uid, action, value_done]
    );
    return (result as any).insertId;
  }

  // เพิ่ม action แบบอัตโนมัติ (ไม่ต้องมี value_done)
  static async insertActivityHistory(uid: string, act_detail_id: string, action: number) {
    await pool.execute(
      `INSERT INTO activity_history (uid, act_detail_id, action, create_at) VALUES (?, ?, ?, NOW())`,
      [uid, act_detail_id, action]
    );
  }

  // รวม action เฉพาะวันนี้
  static async getTodayActionSum(uid: string, act_detail_id: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT IFNULL(SUM(action), 0) as total 
       FROM activity_history 
       WHERE uid = ? AND act_detail_id = ? AND DATE(create_at) = CURDATE()`,
      [uid, act_detail_id]
    );
    return rows[0]?.total ?? 0;
  }

  // ดึง goal จาก activity_detail
  static async getGoal(uid: string, act_detail_id: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT goal FROM activity_detail WHERE uid = ? AND act_detail_id = ?`,
      [uid, act_detail_id]
    );
    return rows[0]?.goal ?? null;
  }

  // ดึง history ล่าสุดของ uid + act_detail_id
  static async getLatestHistory(uid: string, act_detail_id: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM activity_history 
       WHERE uid = ? AND act_detail_id = ? 
       ORDER BY create_at DESC 
       LIMIT 1`,
      [uid, act_detail_id]
    );
    return rows[0];
  }

  // ลบ history ตาม history_id
  static async deleteHistoryById(history_id: number) {
    await pool.execute(
      `DELETE FROM activity_history WHERE history_id = ?`,
      [history_id]
    );
  }
}
