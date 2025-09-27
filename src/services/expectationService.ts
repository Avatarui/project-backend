import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/database";
import { ExpectationBody, ExpectationRow } from "../types/expectation";

export const createExpectationService = async (
  data: ExpectationBody
): Promise<number> => {
  const { act_id, uid, user_exp } = data;
  console.log(data);
  const [result] = await pool.execute<ResultSetHeader>(
    "INSERT INTO expectation (act_id, uid, user_exp) VALUES (?, ?, ?)",
    [act_id, uid, user_exp]
  );
  return result.insertId; // คืน exp_id ที่เพิ่งสร้าง
};

export const getExpectationsByUserService = async (
  uid: string
): Promise<ExpectationRow[]> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM expectation WHERE uid = ?",
    [uid]
  );
  return rows as ExpectationRow[];
};
export const checkExpectationDB = async (actId: string, uid: string): Promise<boolean> => {
  const [rows] = await pool.execute(
    "SELECT * FROM expectation WHERE act_id = ? AND uid = ?",
    [actId, uid]
  );
  return (rows as any[]).length > 0;
};

// ดึง user_exp ของ activity
export const getExpectationsByActIdAndUser = async (actId: string, uid: string) => {
  const [rows] = await pool.execute(
    "SELECT user_exp FROM expectation WHERE act_id = ? AND uid = ?",
    [actId, uid]
  );
  return (rows as any[])[0] || null;
};