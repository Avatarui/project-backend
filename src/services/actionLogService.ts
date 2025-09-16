
import pool from "../config/database";

export class ActionLogService {
  static async insertActionLog(params: {
    target: string;
    action: "suspend" | "deleted";
    reason: string;
    actionBy: string;
  }): Promise<void> {
    const { target, action, reason, actionBy } = params;
    await pool.execute(
      `INSERT INTO action_log (target, action, reason, action_by) VALUES (?, ?, ?, ?)`,
      [target, action, reason, actionBy]
    );
  }
}
