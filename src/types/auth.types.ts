// auth.type.ts
import type { Request } from "express";
import type { JwtPayload as JWTPayloadBase } from "jsonwebtoken";

/** บทบาทผู้ใช้ในระบบ */
export type Role = "admin" | "member";

/** สถานะผู้ใช้ที่ระบบรองรับ */
export type UserStatus = "active" | "suspended" | "deleted";


/** Payload ที่ใช้สำหรับส่งเข้า endpoint login ด้วยอีเมล */
export interface LoginWithEmailRequest {
  idToken: string;
}

/** ฟอร์มล็อกอิน/สมัครสมาชิก */
export interface UserLogin {
  email: string;
  password: string;
}

export interface UserRegister {
  email: string;
  password: string;
  username: string;
  birthday?: string;
}

export interface AdminRegister {
  email: string;
  password: string;
  username: string;
}

/** แถวข้อมูลที่อ่านจากตารางผู้ใช้ (ปรับให้มีทั้ง role และ status) */
export interface UserRow {
  uid?: string;
  email?: string;
  username?: string;
  role: Role;
  status: UserStatus;
  birthday?: string;
  photo_url?: string;
}

/** ข้อมูลโปรไฟล์ผู้ใช้ที่ฝั่ง backend ส่งกลับให้ client */
export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  photo_url?: string;
  role: Role;
  status: UserStatus;   // ← ใช้ UserStatus แบบ union ชัดเจน
  birthday?: string;
}

/** ค่าที่จะถูกใส่ใน JWT ของ backend */
export interface JwtPayload extends JWTPayloadBase {
  userId: string; // มักจะเป็น uid
  role: Role;
  // ไม่จำเป็นต้องใส่ status ใน JWT ถ้าไม่ต้องการ — ให้ตรวจ status จาก DB ขณะ login ก็พอ
}

/** user ที่ถูกแนบเข้า req หลัง auth middleware */
export type AuthUser = {
  uid: string;
  role: Role;
};

/** Request ที่แนบ user เข้ามาหลังผ่าน auth middleware แล้ว */
export interface AuthRequest extends Request {
  user?: AuthUser;
}
