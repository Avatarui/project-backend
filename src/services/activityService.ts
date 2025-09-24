import pool from "../config/database";

export const checkCategoryExists = async (cate_id: string, uid: string) => {
  const [rows] = await pool.execute(
    "SELECT cate_id FROM category WHERE cate_id = ? AND uid = ?",
    [cate_id, uid]
  );
  return (rows as any[]).length > 0;
};

export const createActivityDB = async (
  uid: string,
  cate_id: string,
  act_name: string,
  act_pic: string
) => {
  await pool.execute(
    "INSERT INTO activity (uid, cate_id, act_name, act_pic) VALUES (?, ?, ?, ?)",
    [uid, cate_id, act_name, act_pic]
  );
};

export const getActivitiesDB = async (
  role: string | undefined,
  uid: string | undefined,
  cate_id?: string
) => {
  // validate เบื้องต้น
  if (!role) throw new Error("role is required");
  if (role !== "admin" && !uid) throw new Error("uid is required for member");

  const conds: string[] = [];
  const params: any[] = [];

  if (role === "admin") {
    // no-op condition; หรือจะไม่ใส่ WHERE ก็ได้ถ้าไม่มีเงื่อนไขอื่น
    conds.push("1");
  } else {
    // (uid = ? OR uid IN (...)) เพื่อ precedence ที่ถูกต้อง
    conds.push("(uid = ? OR uid IN (SELECT uid FROM users WHERE role = 'admin'))");
    params.push(uid as string); // มีค่าแน่ ๆ เพราะเช็คไว้แล้ว
  }

  // จัดการ cate_id: แปลงเป็น number และ bind เฉพาะเมื่อมีค่า
  if (cate_id != null) {
    const cateNum = Number(cate_id);
    if (!Number.isFinite(cateNum)) {
      throw new Error("cate_id must be a number");
    }
    conds.push("cate_id = ?");
    params.push(cateNum);
  } else {
    // ถ้า member ไม่ส่ง cate_id → ไม่อนุญาต (เพื่อกัน undefined ไปถึง SQL)
    if (role !== "admin") {
      throw new Error("cate_id is required for member");
    }
    // admin ไม่ส่ง cate_id → ดึงทั้งหมดได้ (ปล่อย conds = ["1"])
  }

  const sql =
    `SELECT act_id, act_name, act_pic, cate_id, uid
     FROM activity` +
    (conds.length ? ` WHERE ${conds.join(" AND ")}` : "") +
    ` ORDER BY act_id ASC`;

  // สำคัญ: params ต้องไม่มี undefined
  const [rows] = await pool.execute(sql, params);
  return rows as any[];
};


export const checkActivityPermission = async (
  act_id: number,
  uid?: string,
  role?: string
) => {
  let sql = "SELECT act_id FROM activity WHERE act_id = ?";
  const params: any[] = [act_id];

  if (role === "member") {
    sql += " AND uid = ?";
    params.push(uid);
  }

  const [rows] = await pool.execute(sql, params);
  return (rows as any[]).length > 0;
};

export const updateActivityDB = async (
  act_id: number,
  act_name: string,
  act_pic: string,
  uid?: string,
  role?: string
) => {
  let sql = "UPDATE activity SET act_name = ?, act_pic = ? WHERE act_id = ?";
  const params: any[] = [act_name, act_pic, act_id];

  if (role === "member") {
    sql += " AND uid = ?";
    params.push(uid);
  }

  await pool.execute(sql, params);
};

export const deleteActivityDB = async (
  act_id: number,
  uid?: string,
  role?: string
) => {
  let sql = "DELETE FROM activity WHERE act_id = ?";
  const params: any[] = [act_id];

  if (role === "member") {
    sql += " AND uid = ?";
    params.push(uid);
  }

  await pool.execute(sql, params);
};
