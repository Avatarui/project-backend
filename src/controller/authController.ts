import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload as JWTPayloadBase } from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { UserLogin, UserRegister } from "../types/user";
import router from "../route/auth";
import admin from "firebase-admin";
import { UserModel } from "../model/User";
import { signInWithEmailAndPassword } from "firebase/auth";
import { log } from "console";
import { RowDataPacket } from "mysql2";
import pool from "../config/database";
import { AuthRequest } from "../middleware/auth";
// import { auth } from '../config/firebase';

export const registerValidation = [
  body("username")
    .isLength({ min: 3, max: 100 })
    .withMessage("Name must be between 3 and 100 characters"),
  body("email")
    .isEmail()
    .isLength({ max: 255 })
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("usertype")
    .optional()
    .isLength({ max: 20 })
    .withMessage("Telephone must not exceed 20 characters"),
];

export const loginValidation = [
  body("email").notEmpty().withMessage("Email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];
interface UserRow {
  role: string;
}
function convertDateFormat(dateStr: string): string {
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, username, birthday } = req.body;
    const file = req.file;

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username,
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    let photoURL = "";

    if (file) {
      const bucket = admin.storage().bucket();
      const fileName = `profileImages/${userRecord.uid}_${Date.now()}`;
      const fileUpload = bucket.file(fileName);

      await fileUpload.save(file.buffer, {
        metadata: { contentType: file.mimetype },
      });
      await fileUpload.makePublic();
      photoURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    }

    const formattedBirthday = birthday ? convertDateFormat(birthday) : null;

    const sql = `
      INSERT INTO users (uid, email, username, photo_url, role, birthday, status, password)
      VALUES (?, ?, ?, ?, 'member', ?, 'active', ?)
    `;
    await pool.execute(sql, [
      userRecord.uid,
      email,
      username,
      photoURL,
      formattedBirthday,
      hashedPassword,
    ]);

    res.status(201).json({
      message: "User registered successfully",
      uid: userRecord.uid,
      photoURL,
    });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const adminRegister = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, username } = req.body;

    // hash password ก่อนเก็บใน database (saltRounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // สร้างผู้ใช้ใน Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username,
    });

    // บันทึกลง MySQL (ชื่อฟิลด์ให้ตรงกับตาราง)
    await pool.query(
      `INSERT INTO users (uid, email, username, role, password) VALUES (?, ?, ?, ?, ?)`,
      [userRecord.uid, email, username, "admin", hashedPassword]
    );

    res.status(201).json({
      message: "Admin registered successfully",
      uid: userRecord.uid,
    });
  } catch (error: any) {
    console.error("Admin register error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};
interface JwtPayload extends JWTPayloadBase {
  userId: string;
  role: string;
}
export const loginwithemail = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ message: "Firebase ID Token is required." });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // กำหนด type ให้กับ rows โดยระบุว่าเป็น array ของ RowDataPacket ที่มี property role
    const [rows] = await pool.query<(RowDataPacket & UserRow)[]>(
      "SELECT role FROM users WHERE uid = ? AND status = 'active' LIMIT 1",
      [uid]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้ที่เกี่ยวข้องกับ Token นี้" });
    }

    const userRole = rows[0].role || "member";

    const payload: JwtPayload = { userId: uid, role: userRole };
    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    return res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      userId: uid,
      role: userRole,
      token,
    });
  } catch (error: any) {
    console.error("Backend: Error verifying ID Token or fetching user data:", error);

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ message: "เซสชันหมดอายุ โปรดเข้าสู่ระบบใหม่" });
    } else if (
      error.code === "auth/invalid-id-token" ||
      error.code === "auth/argument-error"
    ) {
      return res.status(401).json({ message: "ID Token ไม่ถูกต้องหรือไม่สมบูรณ์" });
    } else if (error.code === "auth/user-not-found") {
      return res.status(404).json({ message: "ไม่พบผู้ใช้ที่เกี่ยวข้องกับ Token นี้" });
    }

    return res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
};

export const loginwithgoogle = async (req: Request, res: Response) => {
  try {
    console.log("Authorization Header:", req.headers.authorization);
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided or invalid format" });
    }
    const idToken = authHeader.split(" ")[1];

    // ตรวจสอบ token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // ตรวจสอบ user ใน MySQL
    const [rows]: any = await pool.execute(
      "SELECT * FROM users WHERE uid = ?",
      [uid]
    );

    if (rows.length === 0) {
      const { email, name, picture } = decodedToken; // เปลี่ยนชื่อให้ตรง
      const sql = `
        INSERT INTO users (uid, email, username, photo_url, role, status)
        VALUES (?, ?, ?, ?, 'member', 'active')
      `;
      await pool.execute(sql, [
        uid,
        email || "",
        name || "",
        picture || "",
      ]);
    }

    const [userRows]: any = await pool.execute(
      "SELECT * FROM users WHERE uid = ?",
      [uid]
    );
    const user = userRows[0];

    res.status(200).json({
      message: "Token verified and user exists",
      user,
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};


export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    res.json({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role, // ใช้ role ตรงกับ middleware
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // ดึงข้อมูลผู้ใช้ทั้งหมดจาก MySQL
    // *** สำคัญ: หลีกเลี่ยงการ SELECT password ***
    const [rows]: any = await pool.execute(
      "SELECT uid, email, username, photo_url, role, status, birthday FROM users where role = 'member' "
    );

    // ปรับ format ของ birthday ให้เป็น String 'YYYY-MM-DD'
    const users = rows.map((user: any) => ({
      uid: user.uid,
      email: user.email,
      username: user.username,
      photo_url: user.photo_url || null, // ถ้า photo_url เป็น null ใน DB ให้ส่ง null ไป
      role: user.role,
      status: user.status,
      // แปลง Date object จาก MySQL เป็น String 'YYYY-MM-DD'
      birthday: user.birthday ? user.birthday.toISOString().split('T')[0] : null,
    }));

    res.status(200).json({
      message: "Users fetched successfully from MySQL",
      users: users, // ส่ง array ของ user objects กลับไป
      
    });

  } catch (error) {
    console.error("Error fetching users from MySQL:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getUserRole = async (req: Request, res: Response) => {
  const uid = req.query.uid as string;

  if (!uid) {
    return res.status(400).json({ message: 'Missing uid' });
  }

  try {
    const [rows]: any = await pool.execute(
      'SELECT role FROM users WHERE uid = ?',
      [uid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const role = rows[0].role;
    return res.status(200).json({ role });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
