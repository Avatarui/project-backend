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
export const getExpectationsByUserService = async (uid: string, actId: string) => {
  const [rows] = await pool.query(
    "SELECT * FROM expectation WHERE uid = ? AND act_id = ?",
    [uid, actId]
  );
  return rows;
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

export const updateExpectationService = async (
  actId: string,
  uid: string,
  userExp: string
): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    "UPDATE expectation SET user_exp = ? WHERE act_id = ? AND uid = ?",
    [userExp, actId, uid]
  );
  return result.affectedRows > 0; // true ถ้า update สำเร็จ
};