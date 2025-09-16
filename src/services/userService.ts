import pool from "../config/database";
import { EditUserInfo, ChangeUserStatus, UserStatus } from "../types/user.types";

export class UserService {
  /**
   * อัปเดตข้อมูลผู้ใช้
   */
  static async updateUserInfo(userData: EditUserInfo): Promise<number> {
    try {
      const { uid, username, email, photo_url, birthday } = userData;
      
      // สร้าง dynamic query สำหรับ update เฉพาะฟิลด์ที่ส่งมา
      const fields: string[] = [];
      const values: any[] = [];
      
      if (username !== undefined) {
        fields.push('username = ?');
        values.push(username);
      }
      if (email !== undefined) {
        fields.push('email = ?');
        values.push(email);
      }
      if (photo_url !== undefined) {
        fields.push('photo_url = ?');
        values.push(photo_url);
      }
      if (birthday !== undefined) {
        fields.push('birthday = ?');
        values.push(birthday);
      }
      
      // เพิ่ม updated_at
      fields.push('updated_at = NOW()');
      values.push(uid);
      
      if (fields.length === 1) { // เหลือแค่ updated_at
        return 0; // ไม่มีการเปลี่ยนแปลงจริง
      }
      
      const sql = `UPDATE users SET ${fields.join(', ')} WHERE uid = ? AND status != 'deleted'`;
      
      const [result]: any = await pool.execute(sql, values);
      return result.affectedRows;
    } catch (error) {
      console.error('Error in updateUserInfo:', error);
      throw error;
    }
  }

  /**
   * อัปเดตสถานะผู้ใช้
   */
  static async updateUserStatus(data: ChangeUserStatus): Promise<number> {
    try {
      const { uid, status } = data;
      
      const sql = `
        UPDATE users 
        SET status = ?, updated_at = NOW() 
        WHERE uid = ? AND status != ?
      `;
      
      const [result]: any = await pool.execute(sql, [status, uid, status]);
      return result.affectedRows;
    } catch (error) {
      console.error('Error in updateUserStatus:', error);
      throw error;
    }
  }

  /**
   * ตรวจสอบว่าผู้ใช้มีอยู่จริงและไม่ได้ถูกลบ
   */
  static async checkUserExists(uid: string): Promise<boolean> {
    try {
      const [rows]: any = await pool.execute(
        "SELECT uid FROM users WHERE uid = ? AND status != 'deleted' LIMIT 1",
        [uid]
      );
      return rows.length > 0;
    } catch (error) {
      console.error('Error in checkUserExists:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลผู้ใช้
   */
  static async getUserByUid(uid: string) {
    try {
      const [rows]: any = await pool.execute(
        "SELECT uid, email, username, photo_url, role, status, birthday FROM users WHERE uid = ? AND status != 'deleted' LIMIT 1",
        [uid]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in getUserByUid:', error);
      throw error;
    }
  }
}