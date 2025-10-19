import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/database";
import {
  ActivityDetail,
  DailyOverallPercent,
} from "../types/activityDetail.types";

export const insertActivityDetail = async (data: ActivityDetail) => {
  const timeRemindJson = JSON.stringify(data.time_remind ?? []);
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO activity_detail
       (uid, act_id, goal, unit, round, message, time_remind)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.uid,
      data.act_id,
      data.goal,
      data.unit,
      data.round,
      data.message,
      timeRemindJson,
    ]
  );
  return (result as ResultSetHeader).insertId;
};

export const deleteActivityDetailById = async (
  uid: string,
  act_detail_id: number
) => {
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM activity_detail WHERE act_detail_id = ? AND uid = ?`,
    [act_detail_id, uid]
  );
  return result.affectedRows;
};

export const getActivityDetailsWithMaster = async (uid: string) => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `
    SELECT 
      ad.act_detail_id,
      ad.act_id,   -- เพิ่ม act_id
      ad.goal,
      ad.unit,
      ad.round,
      ad.create_at,
      a.act_name,
      a.act_pic,
      COALESCE(SUM(ah.action), 0) AS current_value
    FROM activity_detail ad
    JOIN activity a ON ad.act_id = a.act_id
    LEFT JOIN activity_history ah 
      ON ad.act_detail_id = ah.act_detail_id
      AND ad.uid = ah.uid
      AND ah.create_at = CURDATE()   
    WHERE ad.uid = ?
      AND (
            (ad.round = 'day' AND ad.create_at = CURDATE())
         OR (ad.round = 'week' AND CURDATE() BETWEEN ad.create_at AND DATE_ADD(ad.create_at, INTERVAL 6 DAY))
      )
    GROUP BY 
      ad.act_detail_id, ad.act_id, ad.goal, ad.unit, ad.round, ad.create_at, a.act_name, a.act_pic
    ORDER BY ad.act_detail_id ASC
    `,
    [uid]
  );

  return rows as (ActivityDetail & {
    act_id: string; // เพิ่มใน type ด้วย
    act_name: string;
    act_pic: string;
    current_value: number;
  })[];
};

export const getActivityDetailByIdAndUid = async (
  uid: string,
  act_detail_id: string | number
) => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM activity_detail WHERE act_detail_id = ? AND uid = ?`,
    [act_detail_id, uid]
  );
  return rows[0] as ActivityDetail | undefined;
};

export const updateCurrentValueByUid = async (
  uid: string,
  act_detail_id: string | number,
  value: number
) => {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE activity_detail SET current_value = ? WHERE act_detail_id = ? AND uid = ?`,
    [value, act_detail_id, uid]
  );
  return result.affectedRows;
};

export const getCurrentAndGoal = async (
  uid: string,
  act_detail_id: string | number
) => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT current_value, goal FROM activity_detail WHERE act_detail_id = ? AND uid = ?`,
    [act_detail_id, uid]
  );
  return rows[0] as { current_value: number; goal: number } | undefined;
};

//---------------------------------------
export async function getOverallPercent(
  uid: string,
  range: string
): Promise<{ date: string; overall_percent: number }[]> {
  let groupBy = "DATE(ah.create_at)";
  let orderBy = "DATE(ah.create_at)";

  // ปรับการ group ตามช่วงเวลาที่ต้องการ
  if (range === "month") {
    groupBy = "DATE_FORMAT(ah.create_at, '%Y-%m')"; // เดือน
    orderBy = "DATE_FORMAT(ah.create_at, '%Y-%m')";
  } else if (range === "year") {
    groupBy = "YEAR(ah.create_at)"; // ปี
    orderBy = "YEAR(ah.create_at)";
  }

  const sql = `
    SELECT
      ${groupBy} AS date,
      LEAST(SUM(ah.action) / SUM(ad.goal) * 100, 100) AS overall_percent
    FROM activity_history ah
    JOIN activity_detail ad
      ON ah.act_detail_id = ad.act_detail_id
    WHERE ah.uid = ?
    GROUP BY ${groupBy}
    ORDER BY ${orderBy};
  `;

  const [rows] = await pool.execute(sql, [uid]);

  return (rows as any[]).map((row) => ({
    date: row.date,
    overall_percent: Number(row.overall_percent) || 0,
  }));
}
export const getActiveActivitiesByUid = async (uid: string) => {
  try {
    const [rows] = await pool.query(
      `SELECT ad.*, a.act_name AS activity_name
       FROM activity_detail ad
       JOIN activity a ON ad.act_id = a.act_id
       WHERE ad.uid = ?
         AND (
           (ad.round = 'week' AND DATEDIFF(CURDATE(), ad.create_at) < 7)
           OR
           (ad.round = 'day' AND DATEDIFF(CURDATE(), ad.create_at) < 1)
         )`,
      [uid]
    );
    return rows;
  } catch (error) {
    console.error("❌ Error in getActiveActivitiesByUid:", error);
    throw error;
  }
};

export const getAllActivity = async (uid: string) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         ad.*,       -- ข้อมูล activity_detail
         a.act_name,
         a.act_pic
       FROM activity_detail ad
       JOIN activity a ON ad.act_id = a.act_id
       WHERE ad.uid = ?`,
      [uid]
    );

    return rows;
  } catch (error) {
    console.error("Error fetching activities:", error);
    throw error;
  }
};
export const getDailyPercentAll = async (
  uid: string
): Promise<{ date: string; percent: number }[]> => {
  try {
    const sql = `SELECT
  t.d AS date,
  LEAST(
    (SUM(t.action_sum) / NULLIF(SUM(ad.goal), 0)) * 100,
    100
  ) AS percent
FROM (
  SELECT
    DATE(ah.create_at) AS d,
    ah.uid,
    ah.act_detail_id,
    SUM(ah.action) AS action_sum
  FROM activity_history ah
  WHERE ah.uid = ?
  GROUP BY DATE(ah.create_at), ah.uid, ah.act_detail_id
) AS t
JOIN activity_detail ad
  ON ad.act_detail_id = t.act_detail_id
 AND ad.uid = t.uid
GROUP BY t.d
ORDER BY t.d;
`;

    const [rows] = await pool.execute(sql, [uid]);

    return (rows as any[]).map((r) => ({
      date: r.date,
      percent: Number(r.percent) || 0,
    }));
  } catch (error) {
    console.error("❌ Error in getDailyPercentAll:", error);
    throw error;
  }
};
