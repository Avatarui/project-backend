import pool from "../config/database";

export class CategoryService {
  // สมาชิก: get categories (ตัวเอง + ของ admin)
  static async getMemberCategories(uid: string) {
    const [rows] = await pool.execute(
      'SELECT * FROM category WHERE uid IN (?, (SELECT uid FROM users WHERE role = "admin"))',
      [uid]
    );
    return rows;
  }

  // Admin: add default category
  static async addDefaultCategory(uid: string, cate_name: string, cate_pic: string) {
    const [result] = await pool.execute(
      "INSERT INTO category (uid, cate_name, cate_pic) VALUES (?, ?, ?)",
      [uid, cate_name, cate_pic]
    );
    return result;
  }

  // Admin: get default categories
  static async getDefaultCategories(uid: string) {
    const [rows] = await pool.execute(
      "SELECT * FROM category WHERE uid = ?",
      [uid]
    );
    return rows;
  }

  // Admin: update category
  static async updateDefaultCategory(uid: string, cate_id: number, cate_name: string, cate_pic: string) {
    const [result] = await pool.execute(
      "UPDATE category SET cate_name = ?, cate_pic = ? WHERE uid = ? AND cate_id = ?",
      [cate_name, cate_pic, uid, cate_id]
    );
    return result;
  }

  // Admin: delete category
  static async deleteDefaultCategory(uid: string, cate_id: number) {
    const [result] = await pool.execute(
      "DELETE FROM category WHERE uid = ? AND cate_id = ?",
      [uid, cate_id]
    );
    return result;
  }
}
