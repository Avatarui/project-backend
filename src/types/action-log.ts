// types/action-log.ts
export type ActionLogAction = 'suspend' | 'deleted';
export type ActionLogRow = {
  action_id: number;
  target: string;
  action: "active" | "suspended" | "deleted";
  reason: string;
  action_by: string;
  create_at: Date; // ควรเป็น Date เมื่ออ่านจาก mysql2
};

// โครงสร้างสำหรับส่งให้ client (ถ้าจะใช้ camelCase/แปลงวันที่เป็น ISO)
export type ActionLogDTO = {
  actionId: number;
  target: string;
  action: "active" | "suspended" | "deleted";
  reason: string;
  actionBy: string;
  createAt: string; // ISO string
};