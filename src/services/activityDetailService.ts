import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/database";
import { ActivityDetail } from "../types/activityDetail.types";

export const insertActivityDetail = async (data: ActivityDetail) => {
  const timeRemindJson = JSON.stringify(data.time_remind ?? []);
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO activity_detail
       (uid, act_id, goal, unit, round, message, time_remind)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.uid, data.act_id, data.goal, data.unit, data.round, data.message, timeRemindJson]
  );
  return (result as ResultSetHeader).insertId;
};

export const deleteActivityDetailById = async (uid: string, act_detail_id: string | number) => {
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM activity_detail WHERE act_detail_id = ? AND uid = ?`,
    [act_detail_id, uid]
  );
  return result.affectedRows;
};

export const getActivityDetailsByUid = async (uid: string) => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM activity_detail WHERE uid = ?`,
    [uid]
  );
  return rows as ActivityDetail[];
};

export const getActivityDetailByIdAndUid = async (uid: string, act_detail_id: string | number) => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM activity_detail WHERE act_detail_id = ? AND uid = ?`,
    [act_detail_id, uid]
  );
  return rows[0] as ActivityDetail | undefined;
};

export const updateCurrentValueByUid = async (uid: string, act_detail_id: string | number, value: number) => {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE activity_detail SET current_value = ? WHERE act_detail_id = ? AND uid = ?`,
    [value, act_detail_id, uid]
  );
  return result.affectedRows;
};

export const getCurrentAndGoal = async (uid: string, act_detail_id: string | number) => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT current_value, goal FROM activity_detail WHERE act_detail_id = ? AND uid = ?`,
    [act_detail_id, uid]
  );
  return rows[0] as { current_value: number; goal: number } | undefined;
};
