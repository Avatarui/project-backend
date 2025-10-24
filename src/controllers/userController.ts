import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { UserService } from "../services/userService";
import {
  EditUserInfo,
  ChangeUserStatus,
  UpdateMyStatusRequest,
  UserStatus,
  UserStatusSelf,
  ApiResponse,
  EditUserInfoBody,
  EditUserPayload,
} from "../types/user.types";

import { AuthRequest } from "../middlewares/auth";
import {
  VALID_ADMIN_STATUSES,
  VALID_SELF_STATUSES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from "../constants/userConstants";

/**
 * Member functionality - อัปเดตข้อมูลส่วนตัว
 */
export const editUserInfo = async (
  req: AuthRequest,
  res: Response<ApiResponse>
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: errors.array(),
      });
    }

    if (!req.user?.uid) {
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED || "Unauthorized",
      });
    }

    // ✅ ไม่รับ email เลย
    const {email, username, photo_url, birthday } = req.body as Partial<EditUserInfo>;

    const payload: Partial<EditUserInfo> = {
      username: username ?? undefined,
      email: email ?? undefined, // ❌ ลบบรรทัดนี้
      photo_url: photo_url ?? undefined,
      birthday: birthday ?? undefined,
    };

    const affectedRows = await UserService.updateUserInfo(
      req.user.uid,
      payload
    );

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.NO_CHANGES || "No changes or user not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.USER_UPDATED || "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user info:", error);
    return res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_ERROR || "Internal server error",
    });
  }
};

/**
 * Admin functionality - เปลี่ยนสถานะผู้ใช้ (สำหรับ admin)
 */
import { ActionLogService } from "../services/actionLogService";

// ...
export const changeUserStatus = async (
  req: AuthRequest,
  res: Response<ApiResponse>
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: errors.array(),
      });
    }

    // 1. ดึงค่า status, uid และ reason เดิม (ถ้ามี)
    const { status, uid, reason: originalReason } = req.body;
    
    // 2. กำหนดค่า reason ใหม่ตาม status
    let reason: string;
    
    switch (status) {
      case "suspended":
        reason = originalReason || "ถูกระงับโดยผู้ดูแล";
        break;
      case "deleted":
        reason = originalReason || "ถูกลบโดยผู้ดูแลเนื่องจากทำผิดกฎ";
        break;
      case "active":
        reason = originalReason || "เปิดใช้งานบัญชีอีกครั้งโดยผู้ดูแล";
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
    }


    if (!VALID_ADMIN_STATUSES.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: ERROR_MESSAGES.INVALID_STATUS 
      });
    }

    const userExists = await UserService.checkUserExists(uid);
    if (!userExists) {
      return res.status(404).json({ 
        success: false, 
        message: ERROR_MESSAGES.USER_NOT_FOUND 
      });
    }

    // 3. เรียกใช้ Service ด้วยค่า reason ที่ถูกกำหนดแล้ว
    const affectedRows = await UserService.updateUserStatus({ 
      uid, 
      status,
      reason: reason, // 👈 ใช้ตัวแปร reason ที่ถูกกำหนดเงื่อนไขแล้ว
      actionBy: req.user!.uid  // Admin ที่ทำการเปลี่ยน
    });

    if (affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: ERROR_MESSAGES.NO_CHANGES 
      });
    }

    return res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.STATUS_UPDATED(status),
    });
    
  } catch (error) {
    console.error("Error changing user status:", error);
    return res.status(500).json({ 
      success: false, 
      message: ERROR_MESSAGES.INTERNAL_ERROR 
    });
  }
};

/**
 * Member functionality - อัปเดตสถานะตนเอง
 */
export const updateMyStatus = async (
  req: AuthRequest,
  res: Response<ApiResponse>
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: errors.array(),
      });
    }

    const { status, reason } = req.body;

    if (!VALID_SELF_STATUSES.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: ERROR_MESSAGES.INVALID_STATUS 
      });
    }

    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: ERROR_MESSAGES.UNAUTHORIZED 
      });
    }

    // ✅ ส่ง actionBy เป็นตัวเอง
    const affectedRows = await UserService.updateUserStatus({
      uid: req.user.uid,
      status: status as UserStatus,
      reason,
      actionBy: req.user.uid  // User เปลี่ยน status ตัวเอง
    });

    if (affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: ERROR_MESSAGES.NO_CHANGES 
      });
    }

    return res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.SELF_STATUS_UPDATED(status),
    });
    
  } catch (error) {
    console.error("Error updating user status:", error);
    return res.status(500).json({ 
      success: false, 
      message: ERROR_MESSAGES.INTERNAL_ERROR 
    });
  }
};

/**
 * ดึงข้อมูลผู้ใช้ (เพิ่มเติม)
 */
export const getUsernamesByUids = async (req: Request, res: Response) => {
  try {
    const uids: unknown = req.body?.uids;

    if (!Array.isArray(uids)) {
      return res.status(400).json({ success: false, message: "uids must be an array" });
    }

    // ทำความสะอาด: string, trim, ตัดค่าว่าง, unique, จำกัดขนาด
    const cleaned = [...new Set(
      uids
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    )];

    if (cleaned.length === 0) {
      return res.status(200).json({ success: true, data: { usernames: {} } });
    }
    if (cleaned.length > 200) { // ป้องกัน payload ใหญ่ไป
      return res.status(413).json({ success: false, message: "Too many uids (max 200)" });
    }

    const map = await UserService.getUsernamesMapByUids(cleaned);

    // คืนค่าเป็น map { uid: username|null } - ถ้าไม่พบให้เป็น null
    const usernames: Record<string, string | null> = {};
    for (const uid of cleaned) {
      usernames[uid] = map[uid] ?? null;
    }

    return res.status(200).json({
      success: true,
      message: "Usernames retrieved successfully",
      data: { usernames },
    });
  } catch (error) {
    console.error("getUsernamesByUids error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
export const getUserInfo = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: "UID is required",
      });
    }

    const user = await UserService.getUserByUid(uid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    return res.status(200).json({
      success: true,
      message: "User information retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error getting user info:", error);
    return res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_ERROR,
    });
  }
};
export const editUserByAdmin = async (
  req: AuthRequest,
  res: Response<ApiResponse>
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: errors.array(),
      });
    }

    const { uid } = req.params;
    if (!uid) {
      return res.status(400).json({
        success: false,
        message: "User UID is required",
      });
    }

    // ✅ ไม่รับ email เลย
    const { username, photo_url, birthday } = req.body as Partial<EditUserInfo>;

    const payload: Partial<EditUserInfo> = {
      username: username ?? undefined,
      photo_url: photo_url ?? undefined,
      birthday: birthday ?? undefined,
    };

    const affectedRows = await UserService.updateUserInfo(uid, payload);

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.NO_CHANGES || "No changes or user not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.USER_UPDATED || "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user info by admin:", error);
    return res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_ERROR || "Internal server error",
    });
  }
};