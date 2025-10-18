import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { AuthRequest } from "../middlewares/auth";
import { AuthService } from "../services/authService";
import { convertDateFormat } from "../utils/dateHelper";
import { JwtPayload, LoginWithEmailRequest } from "../types/auth.types";
import { guardActive } from "../utils/guardActive";
import { UserStatus } from "../types/auth.types";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, username, birthday } = req.body;
    const file = req.file;

    // สร้าง user ใน Firebase Auth
    const userRecord = await AuthService.createFirebaseUser(
      email,
      password,
      username
    );
    const hashedPassword = await AuthService.hashPassword(password);

    // path รูป (ถ้ามี upload)
    let photoURL = "";
    if (file) {
      photoURL = `/uploads/profileImages/${file.filename}`;
    }

    const formattedBirthday = birthday ? convertDateFormat(birthday) : null;

    await AuthService.createUser({
      uid: userRecord.uid,
      email,
      username,
      photoURL,
      birthday: formattedBirthday,
      hashedPassword,
      role: "member",
    });

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

    const hashedPassword = await AuthService.hashPassword(password);
    const userRecord = await AuthService.createFirebaseUser(
      email,
      password,
      username
    );

    await AuthService.createUser({
      uid: userRecord.uid,
      email,
      username,
      hashedPassword,
      role: "admin",
    });

    res.status(201).json({
      message: "Admin registered successfully",
      uid: userRecord.uid,
    });
  } catch (error: any) {
    console.error("Admin register error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const loginWithEmail = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { idToken }: LoginWithEmailRequest = req.body;
  if (!idToken) {
    return res.status(400).json({ message: "Firebase ID Token is required." });
  }

  try {
    const decodedToken = await AuthService.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const user = await AuthService.getUserByUid(uid);
    if (!user) {
      return res
        .status(404)
        .json({ message: "ไม่พบผู้ใช้ที่เกี่ยวข้องกับ Token นี้" });
    }

    // ✅ ตรวจสอบสถานะ
    if (user.status === "suspended") {
      return res.status(403).json({
        message: "บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ",
        status: "suspended",
      });
    }

    if (user.status === "deleted") {
      return res.status(410).json({
        message: "บัญชีของคุณถูกลบออกจากระบบแล้ว",
        status: "deleted",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: "บัญชีของคุณยังไม่พร้อมใช้งาน กรุณาติดต่อผู้ดูแลระบบ",
        status: user.status,
      });
    }

    // ✅ ถ้า active → ออก token
    const userRole = user.role || "member";
    const payload: JwtPayload = { userId: uid, role: userRole };
    const token = AuthService.generateJWT(payload);

    return res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      uid,
      role: userRole,
      status: user.status,
      token,
    });
  } catch (error: any) {
    console.error(
      "Backend: Error verifying ID Token or fetching user data:",
      error
    );

    if (error.code === "auth/id-token-expired") {
      return res
        .status(401)
        .json({ message: "เซสชันหมดอายุ โปรดเข้าสู่ระบบใหม่" });
    } else if (
      error.code === "auth/invalid-id-token" ||
      error.code === "auth/argument-error"
    ) {
      return res
        .status(401)
        .json({ message: "ID Token ไม่ถูกต้องหรือไม่สมบูรณ์" });
    } else if (error.code === "auth/user-not-found") {
      return res
        .status(404)
        .json({ message: "ไม่พบผู้ใช้ที่เกี่ยวข้องกับ Token นี้" });
    }

    return res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
};

// controllers/auth.controller.ts (เฉพาะส่วนที่ต่าง)

export const loginWithGoogle = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "No token provided or invalid format" });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await AuthService.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userExists = await AuthService.checkUserExists(uid);
    if (!userExists) {
      const { email, name, picture } = decodedToken as {
        email?: string;
        name?: string;
        picture?: string;
      };

      await AuthService.createGoogleUser({
        uid,
        email: email || "",
        username: name || "",
        photo_url: picture || "",
      });
    }

    const user = await AuthService.getUserProfile(uid);
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    // ✅ ตรวจสอบสถานะ
    if (user.status === "suspended") {
      return res.status(403).json({
        message: "บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ",
        status: "suspended",
      });
    }

    if (user.status === "deleted") {
      return res.status(410).json({
        message: "บัญชีของคุณถูกลบออกจากระบบแล้ว",
        status: "deleted",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: "บัญชีของคุณยังไม่พร้อมใช้งาน กรุณาติดต่อผู้ดูแลระบบ",
        status: user.status,
      });
    }

    // ✅ active → สร้าง JWT
    const token = AuthService.generateJWT({
      userId: user.uid,
      role: user.role,
    });

    return res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      uid: user.uid,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      token,
      photo_url: user.photo_url,
      birthday: user.birthday,
    });
  } catch (error: any) {
    console.error("Token verification error:", error);
    if (error.code === "auth/id-token-expired") {
      return res
        .status(401)
        .json({ message: "เซสชันหมดอายุ โปรดเข้าสู่ระบบใหม่" });
    }
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    const profile = await AuthService.getUserProfile(user.uid);
    if (!profile) {
      return res.status(404).json({ message: "User not found" });
    }

    // ถ้า photo_url เป็น relative path ให้ต่อ base URL
    if (profile.photo_url && profile.photo_url.startsWith("/uploads")) {
      profile.photo_url = `${process.env.SERVER_URL}${profile.photo_url}`;
    }

    res.json(profile);
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await AuthService.getAllMembers();

    res.status(200).json({
      message: "Users fetched successfully from MySQL",
      users,
    });
  } catch (error) {
    console.error("Error fetching users from MySQL:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserRole = async (req: Request, res: Response) => {
  const uid = req.query.uid as string;

  if (!uid) {
    return res.status(400).json({ message: "Missing uid" });
  }

  try {
    const user = await AuthService.getUserByUid(uid);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ role: user.role });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
