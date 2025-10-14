import pool from "../config/database";

export class CategoryService {
  // สมาชิก: get categories (ตัวเอง + ของ admin)
  static async getMemberCategories(uid: string) {
    if (!uid) throw new Error("uid is required");

    const sql = `
      SELECT cate_id, cate_name, cate_pic, uid
      FROM category
      WHERE uid = ?
         OR uid IN (SELECT uid FROM users WHERE role = 'admin')
      ORDER BY cate_id ASC
    `;
    const [rows] = await pool.execute(sql, [uid]);
    return rows;
  }

  // Admin: add default category
  static async addDefaultCategory(uid: string, cate_name: string, cate_pic: string) {
    if (!uid) throw new Error("uid is required");
    if (!cate_name) throw new Error("cate_name is required");
    if (!cate_pic) throw new Error("cate_pic is required");

    const sql = `
      INSERT INTO category (uid, cate_name, cate_pic)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [uid, cate_name, cate_pic]);
    return result;
  }

  // Admin: get default categories
  static async getDefaultCategories(uid: string) {
    if (!uid) throw new Error("uid is required");

    // หมายเหตุ: ถ้าออกแบบให้ default เป็นของ "admin คนนี้" เท่านั้น ให้คง WHERE uid = ?
    // ถ้าต้องการดู default ของ admin ทุกคน ให้ปรับที่ controller/route แทน (ตามที่คุย)
    const sql = `
      SELECT cate_id, cate_name, cate_pic, uid
      FROM category
      WHERE uid = ?
      ORDER BY cate_id ASC
    `;
    const [rows] = await pool.execute(sql, [uid]);
    return rows;
  }

  // Admin: update category
  static async updateDefaultCategory(uid: string, cate_id: number, cate_name: string, cate_pic: string) {
    if (!uid) throw new Error("uid is required");
    if (cate_id === undefined || cate_id === null) throw new Error("cate_id is required");
    if (!cate_name) throw new Error("cate_name is required");
    if (!cate_pic) throw new Error("cate_pic is required");

    const sql = `
      UPDATE category
      SET cate_name = ?, cate_pic = ?
      WHERE uid = ? AND cate_id = ?
    `;
    const [result] = await pool.execute(sql, [cate_name, cate_pic, uid, cate_id]);
    return result;
  }

  // Admin: delete category
  static async deleteDefaultCategory(uid: string, cate_id: number) {
    if (!uid) throw new Error("uid is required");
    if (cate_id === undefined || cate_id === null) throw new Error("cate_id is required");

    // ถ้ามีตาราง mapping อื่นที่อ้างอิง cate_id อาจต้องลบก่อน (หรือใช้ FK + ON DELETE CASCADE)
    const sql = `
      DELETE FROM category
      WHERE uid = ? AND cate_id = ?
    `;
    const [result] = await pool.execute(sql, [uid, cate_id]);
    return result;
  }
}
