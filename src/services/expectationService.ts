import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/database";
import { ExpectationBody, ExpectationRow } from "../types/expectation";

export const createExpectationService = async (
  data: ExpectationBody
): Promise<number> => {
  const { act_id, uid, user_exp } = data;
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