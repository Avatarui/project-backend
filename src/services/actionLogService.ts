// services/actionLogService.ts
import pool from "../config/database";
import type { RowDataPacket } from "mysql2";

// แถวเต็มของ action_log
export type ActionLogRow = {
  action_id: number;
  target: string;
  action: "active" | "suspended" | "deleted";
  reason: string;
  action_by: string;
  create_at: Date; // หรือ string ถ้า DB ส่งกลับเป็น string
};

// แถวจากคิวรี "ล่าสุดต่อ target"
export type LatestTargetRow = {
  target: string;
  reason: string;
  create_at: Date;
  action_by: string;
  action_id: number;
};

// สำหรับ insert
export type CreateActionLogParams = {
  target: string;
  action: "active" | "suspended" | "deleted";
  reason: string;
  actionBy: string;
};

export class ActionLogService {
  static async insertActionLog(params: CreateActionLogParams): Promise<void> {
    const { target, action, reason, actionBy } = params;
    await pool.execute(
      `INSERT INTO action_log (target, action, reason, action_by) VALUES (?, ?, ?, ?)`,
      [target, action, reason, actionBy]
    );
  }

  // ดึงแถวเต็มตาม action_id
  static async getActionLogById(
    actionId: number
  ): Promise<ActionLogRow | null> {
    const sql = `
      SELECT action_id, target, action, reason, action_by, create_at
      FROM action_log
      WHERE action_id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [actionId]);
    if (rows.length === 0) return null;
    return rows[0] as unknown as ActionLogRow;
  }

  // ดึง “ล่าสุดต่อ target”
  static async getLatestTargetsWithReason(): Promise<LatestTargetRow[]> {
    const sqlWindow = `
      WITH ranked AS (
        SELECT
          target,
          reason,
          create_at,
          action_id,
          action_by,
          ROW_NUMBER() OVER (
            PARTITION BY target
            ORDER BY create_at DESC, action_id DESC
          ) AS rn
        FROM action_log
        WHERE action <> 'active'
          AND NULLIF(TRIM(reason), '') IS NOT NULL
      )
      SELECT target, reason, create_at, action_by, action_id
      FROM ranked
      WHERE rn = 1
      ORDER BY create_at DESC, action_id DESC
    `;

    try {
      const [rows] = await pool.execute<RowDataPacket[]>(sqlWindow);
      return rows as unknown as LatestTargetRow[];
    } catch (err: any) {
      const msg = String(err?.message ?? "").toLowerCase();
      const notSupported =
        msg.includes("not supported") ||
        msg.includes("function not implemented") ||
        msg.includes("row_number") ||
        msg.includes("over clause") ||
        err?.code === "ER_NOT_SUPPORTED_YET";
      if (!notSupported) throw err;
    }

    // Fallback (ไม่มี window function)
    const sqlFallback = `
      SELECT a.target, a.reason, a.create_at, a.action_by, a.action_id
      FROM action_log a
      JOIN (
        SELECT target, MAX(create_at) AS max_created
        FROM action_log
        WHERE action <> 'active'
          AND NULLIF(TRIM(reason), '') IS NOT NULL
        GROUP BY target
      ) m
        ON m.target = a.target
       AND m.max_created = a.create_at
      LEFT JOIN action_log tie
        ON tie.target = a.target
       AND tie.create_at = a.create_at
       AND tie.action_id > a.action_id
      WHERE a.action <> 'active'
        AND NULLIF(TRIM(a.reason), '') IS NOT NULL
        AND tie.action_id IS NULL
      ORDER BY a.create_at DESC, a.action_id DESC
    `;
    const [rows] = await pool.execute<RowDataPacket[]>(sqlFallback);
    return rows as unknown as LatestTargetRow[];
  }
}
