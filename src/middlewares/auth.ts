import { Request, Response, NextFunction } from "express";
import { auth, db, bucket } from '../config/firebase';
import { getUserByUID } from "../models/User";
import { User } from "../types/user.types";
import { log } from "console";
export interface AuthRequest<P = any, ResBody = any, ReqBody = any>
  extends Request<P, ResBody, ReqBody> {
  user?: User;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;

  if (!token) {
    // คุณจะเพิ่ม cookie fallback ที่นี่ก็ได้ เช่น req.cookies.__session
    console.warn(`[AUTH] 401 no token: ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    const userFromDB = await getUserByUID(decodedToken.uid);

    if (!userFromDB) {
      console.warn(`[AUTH] 404 user missing: uid=${decodedToken.uid} ${req.method} ${req.originalUrl}`);
      return res.status(404).json({ message: "User not found in database" });
    }

    // ✅ บล็อกผู้ใช้ที่ไม่ active ตั้งแต่ middleware (ถ้านโยบายคุณต้องการ)
    if (userFromDB.status !== "active") {
      // console.warn(`[AUTH] 403 inactive user: uid=${decodedToken.uid} status=${userFromDB.status} ${req.method} ${req.originalUrl}`);
      return res.status(403).json({ message: "Account is not active", status: userFromDB.status });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      username: decodedToken.name || "",
      status: userFromDB.status as "active" | "suspended" | "deleted",
      role: userFromDB.role as "admin" | "member",
    };

    return next();
  } catch (error: any) {
    console.error(`[AUTH] token error: ${req.method} ${req.originalUrl}`, error?.code || error?.message);
    if (error?.code === "auth/id-token-expired") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    if (error?.code === "auth/invalid-id-token" || error?.code === "auth/argument-error") {
      return res.status(401).json({ message: "Invalid token." });
    }
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  return next();
};