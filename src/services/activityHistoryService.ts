import pool from "../config/database";
import { ActivityHistoryBody } from "../types/activityHistory.types";

export class ActivityHistoryService {
  static async addHistory(history: ActivityHistoryBody) {
    const { act_detail_id, uid, action, value_done } = history;
    const [result] = await pool.execute(
      `INSERT INTO activity_history 
       (act_detail_id, uid, action, value_done)
       VALUES (?, ?, ?, ?)`,
      [act_detail_id, uid, action, value_done]
    );

    return (result as any).insertId;
  }
}