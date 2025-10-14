import pool from '../config/database';
import { EditUserInfo, ChangeUserStatus } from '../types/user.types';
import { ResultSetHeader } from 'mysql2';

export const updateUserInfo = async (data: EditUserInfo): Promise<number> => {
  const { uid, username, photo_url, birthday } = data;

  const updates = [];
  const values: any[] = [];

  if (username) {
    updates.push("username = ?");
    values.push(username);
  }
  if (photo_url) {
    updates.push("photo_url = ?");
    values.push(photo_url);
  }
  if (birthday) {
    updates.push("birthday = ?");
    values.push(birthday);
  }

  if (updates.length === 0) return 0;

  const sql = `UPDATE users SET ${updates.join(", ")} WHERE uid = ?`;
  values.push(uid);

  const [result] = await pool.execute(sql, values) as [ResultSetHeader, any];
  return result.affectedRows;
};

export const updateUserStatus = async (data: ChangeUserStatus): Promise<number> => {
  const { uid, status } = data;

  const sql = `UPDATE users SET status = ? WHERE uid = ?`;
  const [result] = await pool.execute(sql, [status, uid]) as [ResultSetHeader, any];
  return result.affectedRows;
};
export const getUserByUID = async (uid: string) => {
  const [rows]: any = await pool.query('SELECT * FROM users WHERE uid = ?', [uid]);
  if (rows.length === 0) return null;
  return rows[0]; // return object type User
};

