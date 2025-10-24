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
  static async addDefaultCategory(
    uid: string,
    cate_name: string,
    cate_pic: string
  ) {
    if (!uid) throw new Error("uid is required");
    if (!cate_name) throw new Error("cate_name is required");
    if (!cate_pic) throw new Error("cate_pic is required");

    // 🔍 1. ตรวจว่าชื่อ category ซ้ำใน user เดียวกันไหม
    const checkSql = `
    SELECT cate_id FROM category
    WHERE uid = ? AND cate_name = ?
  `;
    const [rows] = await pool.execute(checkSql, [uid, cate_name]);
    if ((rows as any[]).length > 0) {
      // ซ้ำ → ไม่ต้อง insert
      return { duplicate: true };
    }

    // ✅ 2. ไม่มีซ้ำ → insert ได้
    const sql = `
    INSERT INTO category (uid, cate_name, cate_pic)
    VALUES (?, ?, ?)
  `;
    const [result] = await pool.execute(sql, [uid, cate_name, cate_pic]);
    return { duplicate: false, result };
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
  static async updateDefaultCategory(
    uid: string,
    cate_id: number,
    cate_name: string,
    cate_pic: string
  ) {
    if (!uid) throw new Error("uid is required");
    if (cate_id === undefined || cate_id === null)
      throw new Error("cate_id is required");
    if (!cate_name) throw new Error("cate_name is required");
    if (!cate_pic) throw new Error("cate_pic is required");

    const sql = `
      UPDATE category
      SET cate_name = ?, cate_pic = ?
      WHERE uid = ? AND cate_id = ?
    `;
    const [result] = await pool.execute(sql, [
      cate_name,
      cate_pic,
      uid,
      cate_id,
    ]);
    return result;
  }

  // Admin: delete category
 static async checkCategoryUsage(uid: string, cate_id: number) {
    const sql = `
      SELECT
        (SELECT COUNT(*) FROM activity a
           WHERE a.uid = ? AND a.cate_id = ?) AS activity_count,
        (SELECT COUNT(*) FROM activity_detail ad
           JOIN activity a2 ON a2.act_id = ad.act_id
         WHERE a2.uid = ? AND a2.cate_id = ?) AS activity_detail_count
    `;
    const [rows] = await pool.execute(sql, [uid, cate_id, uid, cate_id]);
    const row = (rows as any)[0] ?? {};

    const activity_count = Number(row.activity_count ?? 0);
    const activity_detail_count = Number(row.activity_detail_count ?? 0);

    return {
      inUse: activity_count > 0 || activity_detail_count > 0,
      activity_count,
      activity_detail_count,
    };
  }
  static async deleteDefaultCategory(uid: string, cate_id: number) {
    const sql = `
      DELETE FROM category
      WHERE uid = ? AND cate_id = ?
    `;
    const [result]: any = await pool.execute(sql, [uid, cate_id]);
    return result;
  }
}

