import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

// สำหรับ admin
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Admin access required" });
  next();
};
