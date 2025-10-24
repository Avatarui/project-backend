import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/database";
import {
  EditUserInfo,
  ChangeUserStatus,
  UserStatus,
  EditUserInfoBody,
  EditUserPayload,
} from "../types/user.types";

export class UserService {
  /**
   * อัปเดตข้อมูลผู้ใช้
   */
  // services/userService.ts
  static async updateUserInfo(
    uid: string,
    userData: Partial<EditUserInfo>
  ): Promise<number> {
    try {
      // ✅ ลบ email ออก แม้ client จะส่งมา
      // const { username, photo_url, birthday } = userData;
      const { username, email, photo_url, birthday } = userData; // ❌ เดิม

      const fields: string[] = [];
      const values: any[] = [];

      if (username !== undefined) {
        fields.push("username = ?");
        values.push(username ?? null);
      }
      // ❌ ลบส่วน email ทั้งหมด
      if (email !== undefined) {
        fields.push("email = ?");
        values.push(email ?? null);
      }
      if (photo_url !== undefined) {
        fields.push("photo_url = ?");
        values.push(photo_url ?? null);
      }
      if (birthday !== undefined) {
        fields.push("birthday = ?");
        values.push(birthday ?? null);
      }

      if (fields.length === 0) return 0;

      const setClause = fields.join(", ");
      const sql = `UPDATE users SET ${setClause} WHERE uid = ?`;
      values.push(uid);

      const [result]: any = await pool.execute(sql, values);
      return result.affectedRows;
    } catch (error) {
      console.error("Error in updateUserInfo:", error);
      throw error;
    }
  }

  /**
   * อัปเดตสถานะผู้ใช้
   */
  static async updateUserStatus(data: ChangeUserStatus): Promise<number> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const { uid, status, reason, actionBy } = data;

      // 1) ดึงข้อมูล user (กัน user ไม่มี)
      const [users] = await connection.execute<RowDataPacket[]>(
        "SELECT uid, email, username FROM users WHERE uid = ?",
        [uid]
      );
      if (users.length === 0) {
        throw new Error("User not found");
      }

      // 2) log การกระทำ
      await connection.execute(
        `INSERT INTO action_log (target, action, reason, action_by)
       VALUES (?, ?, ?, ?)`,
        [uid, status, reason || "", actionBy]
      );

      // 3) ดำเนินการกับ user ตามสถานะ
      let result: any;
      if (status === "deleted") {
        // ลบผู้ใช้ (จะ CASCADE ไปตารางลูกตาม FK)
        [result] = await connection.execute("DELETE FROM users WHERE uid = ?", [
          uid,
        ]);
      } else if (status === "suspended" || status === "active") {
        // อัปเดตสถานะ
        [result] = await connection.execute(
          "UPDATE users SET status = ? WHERE uid = ?",
          [status, uid]
        );
      } else {
        throw new Error(`Invalid status: ${status}`);
      }

      await connection.commit();
      return result.affectedRows ?? 0;
    } catch (error) {
      await connection.rollback();
      console.error("Error in updateUserStatus:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async checkUserExists(uid: string): Promise<boolean> {
    try {
      const [rows]: any = await pool.execute(
        "SELECT uid FROM users WHERE uid = ?  LIMIT 1",
        [uid]
      );
      return rows.length > 0;
    } catch (error) {
      console.error("Error in checkUserExists:", error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลผู้ใช้
   */
  static async getUserByUid(uid: string) {
    try {
      const [rows]: any = await pool.execute(
        "SELECT uid, email, username, photo_url, role, status, birthday FROM users WHERE uid = ?  LIMIT 1",
        [uid]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("Error in getUserByUid:", error);
      throw error;
    }
  }

  static async getUsernamesMapByUids(
    uids: string[]
  ): Promise<Record<string, string>> {
    if (uids.length === 0) return {};

    // สร้าง placeholders (?, ?, ...)
    const placeholders = uids.map(() => "?").join(", ");

    const sql = `
      SELECT uid, username
      FROM users
      WHERE uid IN (${placeholders})
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(sql, uids);

    const map: Record<string, string> = {};
    for (const r of rows) {
      const uid = (r as any).uid as string;
      const username = (r as any).username as string | null;
      if (uid) map[uid] = username ?? "";
    }
    return map;
  }
  static async updateUserByAdmin(
    uid: string,
    payload: EditUserPayload
  ): Promise<number> {
    try {
      const { username, birthday } = payload;

      if (!username && !birthday) {
        throw new Error("No fields to update");
      }

      const fields: string[] = [];
      const values: any[] = [];

      if (username) {
        fields.push("username = ?");
        values.push(username);
      }
      if (birthday) {
        fields.push("birthday = ?");
        values.push(birthday);
      }

      values.push(uid); // สำหรับ WHERE

      const sql = `UPDATE users SET ${fields.join(", ")} WHERE uid = ?`;
      const [result] = await pool.execute<ResultSetHeader>(sql, values);

      return result.affectedRows;
    } catch (error) {
      console.error("Error in updateUserByAdmin:", error);
      throw error;
    }
  }
}
