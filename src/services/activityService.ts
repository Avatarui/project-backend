import { RowDataPacket } from "mysql2";
import pool from "../config/database";
import { ActivityItemSummary, ActivitySummary } from "../types/activity";

export const checkCategoryExists = async (cate_id: string, uid: string) => {
  const [rows] = await pool.execute(
    "SELECT cate_id FROM category WHERE cate_id = ? ",
    [cate_id]
  );
  return (rows as any[]).length > 0;
};

export const createActivityDB = async (
  uid: string,
  cate_id: string,
  act_name: string,
  act_pic: string
) => {
  await pool.execute(
    "INSERT INTO activity (uid, cate_id, act_name, act_pic) VALUES (?, ?, ?, ?)",
    [uid, cate_id, act_name, act_pic]
  );
};

export const getActivitiesDB = async (
  role: string | undefined,
  uid: string | undefined,
  cate_id?: string
) => {
  // validate เบื้องต้น
  if (!role) throw new Error("role is required");
  if (role !== "admin" && !uid) throw new Error("uid is required for member");

  const conds: string[] = [];
  const params: any[] = [];

  if (role === "admin") {
    // no-op condition; หรือจะไม่ใส่ WHERE ก็ได้ถ้าไม่มีเงื่อนไขอื่น
    conds.push("1");
  } else {
    // (uid = ? OR uid IN (...)) เพื่อ precedence ที่ถูกต้อง
    conds.push("(uid = ? OR uid IN (SELECT uid FROM users WHERE role = 'admin'))");
    params.push(uid as string); // มีค่าแน่ ๆ เพราะเช็คไว้แล้ว
  }

  // จัดการ cate_id: แปลงเป็น number และ bind เฉพาะเมื่อมีค่า
  if (cate_id != null) {
    const cateNum = Number(cate_id);
    if (!Number.isFinite(cateNum)) {
      throw new Error("cate_id must be a number");
    }
    conds.push("cate_id = ?");
    params.push(cateNum);
  } else {
    // ถ้า member ไม่ส่ง cate_id → ไม่อนุญาต (เพื่อกัน undefined ไปถึง SQL)
    if (role !== "admin") {
      throw new Error("cate_id is required for member");
    }
    // admin ไม่ส่ง cate_id → ดึงทั้งหมดได้ (ปล่อย conds = ["1"])
  }

  const sql =
    `SELECT act_id, act_name, act_pic, cate_id, uid
     FROM activity` +
    (conds.length ? ` WHERE ${conds.join(" AND ")}` : "") +
    ` ORDER BY act_id ASC`;

  // สำคัญ: params ต้องไม่มี undefined
  const [rows] = await pool.execute(sql, params);
  return rows as any[];
};


export const checkActivityPermission = async (
  act_id: number,
  uid?: string,
  role?: string
) => {
  let sql = "SELECT act_id FROM activity WHERE act_id = ?";
  const params: any[] = [act_id];

  if (role === "member") {
    sql += " AND uid = ?";
    params.push(uid);
  }

  const [rows] = await pool.execute(sql, params);
  return (rows as any[]).length > 0;
};

export const updateActivityDB = async (
  act_id: number,
  act_name: string,
  act_pic: string,
  uid?: string,
  role?: string
) => {
  let sql = "UPDATE activity SET act_name = ?, act_pic = ? WHERE act_id = ?";
  const params: any[] = [act_name, act_pic, act_id];

  if (role === "member") {
    sql += " AND uid = ?";
    params.push(uid);
  }

  await pool.execute(sql, params);
};

export const deleteActivityDB = async (
  act_id: number,
  uid?: string,
  role?: string
) => {
  let sql = "DELETE FROM activity WHERE act_id = ?";
  const params: any[] = [act_id];

  if (role === "member") {
    sql += " AND uid = ?";
    params.push(uid);
  }

  await pool.execute(sql, params);
};
export const countActivitiesDB = async (uid: string) => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt
     FROM activity_detail
     WHERE uid = ?`,
    [uid]
  );
  return Number((rows as any[])[0]?.cnt ?? 0);
};

/** สรุปกิจกรรม: เทียบ total_action vs total_goal ต่อ act_detail_id ของ uid */
export const getActivitySummaryDB = async (uid: string): Promise<ActivitySummary> => { 
  const [rows] = await pool.execute<RowDataPacket[]>(
    `
    WITH goals AS (
      SELECT
        ad.act_detail_id,
        ad.uid,
        ROUND(SUM(
          CASE ad.round
            WHEN 'day'  THEN COALESCE(ad.goal, 0) * 1
            WHEN 'week' THEN COALESCE(ad.goal, 0) * 7
            ELSE 0
          END
        ), 2) AS total_goal
      FROM activity_detail ad
      WHERE ad.uid = ?
      GROUP BY ad.act_detail_id, ad.uid
    ),
    actions AS (
      SELECT
        ah.act_detail_id,
        ROUND(SUM(COALESCE(ah.action, 0)), 2) AS total_action
      FROM activity_history ah
      INNER JOIN activity_detail ad ON ad.act_detail_id = ah.act_detail_id
      WHERE ad.uid = ?
      GROUP BY ah.act_detail_id
    ),
    results AS (
      SELECT
        g.act_detail_id,
        g.total_goal,
        COALESCE(a.total_action, 0) AS total_action,
        CASE
          WHEN COALESCE(a.total_action, 0) = g.total_goal THEN 1
          ELSE 0
        END AS is_success
      FROM goals g
      LEFT JOIN actions a ON a.act_detail_id = g.act_detail_id
    )
    SELECT
      COUNT(*) AS total_activities,
      SUM(CASE WHEN is_success = 1 THEN 1 ELSE 0 END) AS success_count,
      SUM(CASE WHEN is_success = 0 THEN 1 ELSE 0 END) AS failed_count
    FROM results;
    `,
    [uid, uid]
  );

  const summary = rows[0];

  return {
    uid,
    total_activities: Number(summary.total_activities) || 0,
    success_activities: Number(summary.success_count) || 0,
    failed_activities: Number(summary.failed_count) || 0,
    items: [], // ตอนนี้ไม่ดึงรายแถว แต่ถ้าอยากเพิ่มภายหลังค่อยต่อ query แยกได้
  };
};
