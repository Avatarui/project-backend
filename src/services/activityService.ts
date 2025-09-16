import pool from "../config/database";

export const checkCategoryExists = async (cate_id: string, uid: string) => {
  const [rows] = await pool.execute(
    "SELECT cate_id FROM category WHERE cate_id = ? AND uid = ?",
    [cate_id, uid]
  );
  return (rows as any[]).length > 0;
};

export const createActivityDB = async (uid: string, cate_id: string, act_name: string, act_pic: string) => {
  await pool.execute(
    "INSERT INTO activity (uid, cate_id, act_name, act_pic) VALUES (?, ?, ?, ?)",
    [uid, cate_id, act_name, act_pic]
  );
};

export const getActivitiesDB = async (role: string | undefined, uid: string | undefined, cate_id?: string) => {
  let sql = "SELECT * FROM activity WHERE ";
  const params: any[] = [];

  if (role === "admin") {
    sql += "1";
  } else {
    sql += "uid = ? OR uid IN (SELECT uid FROM users WHERE role = 'admin')";
    params.push(uid);
  }

  if (cate_id) {
    sql += " AND cate_id = ?";
    params.push(cate_id);
  }

  const [rows] = await pool.execute(sql, params);
  return rows as any[];
};

export const checkActivityPermission = async (act_id: number, uid?: string, role?: string) => {
  let sql = "SELECT act_id FROM activity WHERE act_id = ?";
  const params: any[] = [act_id];

  if (role === "member") {
    sql += " AND uid = ?";
    params.push(uid);
  }

  const [rows] = await pool.execute(sql, params);
  return (rows as any[]).length > 0;
};

export const updateActivityDB = async (act_id: number, act_name: string, act_pic: string, uid?: string, role?: string) => {
  let sql = "UPDATE activity SET act_name = ?, act_pic = ? WHERE act_id = ?";
  const params: any[] = [act_name, act_pic, act_id];

  if (role === "member") {
    sql += " AND uid = ?";
    params.push(uid);
  }

  await pool.execute(sql, params);
};

export const deleteActivityDB = async (act_id: number, uid?: string, role?: string) => {
  let sql = "DELETE FROM activity WHERE act_id = ?";
  const params: any[] = [act_id];

  if (role === "member") {
    sql += " AND uid = ?";
    params.push(uid);
  }

  await pool.execute(sql, params);
};