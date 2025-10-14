import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import admin from "firebase-admin";
import { RowDataPacket } from "mysql2";
import pool from "../config/database";
import { JwtPayload, UserRow, UserProfile } from "../types/auth.types";
import { log } from "console";

export class AuthService {
  static async createFirebaseUser(email: string, password: string, username: string) {
    return await admin.auth().createUser({
      email,
      password,
      displayName: username,
    });
  }

  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  static async verifyIdToken(idToken: string) {
    return await admin.auth().verifyIdToken(idToken);
  }

  static async getUserByUid(uid: string): Promise<UserRow | null> {
    const [rows] = await pool.query<(RowDataPacket & UserRow)[]>(
      "SELECT role FROM users WHERE uid = ? AND status = 'active' LIMIT 1",
      [uid]
    );

    return rows && rows.length > 0 ? rows[0] : null;
  }

  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    // console.log("Fetching user profile for UID:", uid);
    const [rows] = await pool.execute(
      "SELECT uid, email, username, photo_url, role, status, birthday FROM users WHERE uid = ?",
      [uid]
    );

    return rows && (rows as any[]).length > 0 ? (rows as any[])[0] : null;
  }

  static async getAllMembers(): Promise<any[]> {
    const [rows]: any = await pool.execute(
      "SELECT uid, email, username, photo_url, role, status, birthday FROM users WHERE role = 'member'"
    );

    return rows.map((user: any) => ({
      uid: user.uid,
      email: user.email,
      username: user.username,
      photo_url: user.photo_url || null,
      role: user.role,
      status: user.status,
      birthday: user.birthday ? user.birthday.toISOString().split("T")[0] : null,
    }));
  }

  static generateJWT(payload: JwtPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });
  }

  static async createUser(userData: {
    uid: string;
    email: string;
    username: string;
    photoURL?: string;
    birthday?: string | null;
    hashedPassword?: string;
    role?: string;
  }) {
    const sql = `
      INSERT INTO users (uid, email, username, photo_url, role, birthday, status, password)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
    `;
    
    await pool.execute(sql, [
      userData.uid,
      userData.email,
      userData.username,
      userData.photoURL || "",
      userData.role || "member",
      userData.birthday || null,
      userData.hashedPassword || null,
    ]);
  }

  static async createGoogleUser(userData: {
    uid: string;
    email: string;
    username: string;
    photo_url?: string;
  }) {
    const sql = `
      INSERT INTO users (uid, email, username, photo_url, role, status)
      VALUES (?, ?, ?, ?, 'member', 'active')
    `;
    
    await pool.execute(sql, [
      userData.uid,
      userData.email,
      userData.username,
      userData.photo_url || "",
    ]);
  }

  static async checkUserExists(uid: string): Promise<boolean> {
    const [rows]: any = await pool.execute(
      "SELECT * FROM users WHERE uid = ?",
      [uid]
    );

    return rows.length > 0;
  }
}