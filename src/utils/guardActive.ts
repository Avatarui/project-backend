import { UserStatus } from "../types/auth.types";

/**
 * ตรวจสอบสถานะผู้ใช้ว่าอนุญาตให้เข้าสู่ระบบได้หรือไม่
 * - active → ผ่าน
 * - suspend → 403 Forbidden
 * - deleted → 410 Gone
 */
export function guardActive(status: UserStatus) {
  if (status === "active") return;

  const err: any = new Error(
    status === "suspend"
      ? "บัญชีถูกระงับชั่วคราว กรุณาติดต่อผู้ดูแลระบบ"
      : "บัญชีนี้ถูกลบแล้ว ไม่สามารถใช้งานได้"
  );

  err.code = status === "suspend" ? "ACCOUNT_SUSPENDED" : "ACCOUNT_DELETED";
  err.http = status === "suspend" ? 403 : 410; // 410 = Gone สำหรับ deleted
  throw err;
}
