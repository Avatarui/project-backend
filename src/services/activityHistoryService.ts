// services/activityHistoryService.ts
import { RowDataPacket } from "mysql2";
import pool from "../config/database";
import { ActivityHistoryBody } from "../types/activityHistory.types";

export class ActivityHistoryService {
  // เพิ่ม history (ใช้เวลาที่ add แบบ manual)
  static async addHistory(history: ActivityHistoryBody & { uid: string }) {
    const { act_detail_id, uid, action, value_done = 0 } = history;
    const [result] = await pool.execute(
      `INSERT INTO activity_history 
       (act_detail_id, uid, action, value_done, create_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [act_detail_id, uid, action, value_done]
    );
    return (result as any).insertId;
  }

  // เพิ่ม action แบบอัตโนมัติ
  static async insertActivityHistory(uid: string, act_detail_id: string | number, action: number) {
    await pool.execute(
      `INSERT INTO activity_history (uid, act_detail_id, action, create_at) VALUES (?, ?, ?, NOW())`,
      [uid, act_detail_id, action]
    );
  }

  // รวม action เฉพาะวันนี้
  static async getTodayActionSum(uid: string, act_detail_id: string | number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT IFNULL(SUM(action), 0) as total 
       FROM activity_history 
       WHERE uid = ? AND act_detail_id = ? AND DATE(create_at) = CURDATE()`,
      [uid, act_detail_id]
    );
    return rows[0]?.total ?? 0;
  }

  // ดึง goal
  static async getGoal(uid: string, act_detail_id: string | number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT goal FROM activity_detail WHERE uid = ? AND act_detail_id = ?`,
      [uid, act_detail_id]
    );
    return rows[0]?.goal ?? null;
  }

  // ดึง history ล่าสุด
  static async getLatestHistory(uid: string, act_detail_id: string | number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM activity_history 
       WHERE uid = ? AND act_detail_id = ? 
       ORDER BY create_at DESC LIMIT 1`,
      [uid, act_detail_id]
    );
    return rows[0];
  }

  // ลบ history
  static async deleteHistoryById(history_id: number) {
    await pool.execute(`DELETE FROM activity_history WHERE history_id = ?`, [history_id]);
  }
  static async getDailyPercent(uid: string, act_detail_id: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
          DATE(ah.create_at) as date, 
          LEAST(SUM(ah.action) / ad.goal * 100, 100) as percent
       FROM activity_history ah
       JOIN activity_detail ad ON ah.act_detail_id = ad.act_detail_id
       WHERE ah.uid = ? 
         AND ah.act_detail_id = ?
       GROUP BY DATE(ah.create_at)
       ORDER BY DATE(ah.create_at)`,
      [uid, act_detail_id]
    );
    return rows;
  }
}
