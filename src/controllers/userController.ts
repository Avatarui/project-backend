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
    const { username, photo_url, birthday } = req.body as Partial<EditUserInfo>;

    const payload: Partial<EditUserInfo> = {
      username: username ?? undefined,
      // email: email ?? undefined, // ❌ ลบบรรทัดนี้
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
  req: AuthRequest, // ใช้ AuthRequest เพื่อรู้ว่าใครเป็นคนกระทำ
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

    const { status, uid, reason } = req.body;

    if (!VALID_ADMIN_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: ERROR_MESSAGES.INVALID_STATUS });
    }

    const userExists = await UserService.checkUserExists(uid);
    if (!userExists) {
      return res
        .status(404)
        .json({ success: false, message: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    const affectedRows = await UserService.updateUserStatus({ uid, status });
    if (affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: ERROR_MESSAGES.NO_CHANGES });
    }

    // ✅ Insert Action Log
    if (req.user) {
      // ใน controller เช่น updateMyStatus หรือ changeUserStatus
      await ActionLogService.insertActionLog({
        target: req.user!.uid, // uid ของผู้ใช้ที่ถูกกระทำ
        action: status as "active" | "suspended" | "deleted", // ✅ ตรงกับ ENUM
        reason: reason || "",
        actionBy: req.user!.uid, // uid ของผู้ที่กระทำ (กรณี user = ตัวเอง)
      });
    }

    return res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.STATUS_UPDATED(status),
    });
  } catch (error) {
    console.error("Error changing user status:", error);
    return res
      .status(500)
      .json({ success: false, message: ERROR_MESSAGES.INTERNAL_ERROR });
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
      return res
        .status(400)
        .json({ success: false, message: ERROR_MESSAGES.INVALID_STATUS });
    }

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: ERROR_MESSAGES.UNAUTHORIZED });
    }

    const affectedRows = await UserService.updateUserStatus({
      uid: req.user.uid,
      status: status as UserStatus,
    });

    if (affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: ERROR_MESSAGES.NO_CHANGES });
    }

    // ✅ Insert Action Log
    // ใน controller เช่น updateMyStatus หรือ changeUserStatus
    await ActionLogService.insertActionLog({
      target: req.user!.uid, // uid ของผู้ใช้ที่ถูกกระทำ
      action: status as "active" | "suspended" | "deleted", // ✅ ตรงกับ ENUM
      reason: reason || "",
      actionBy: req.user!.uid, // uid ของผู้ที่กระทำ (กรณี user = ตัวเอง)
    });

    return res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.SELF_STATUS_UPDATED(status),
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return res
      .status(500)
      .json({ success: false, message: ERROR_MESSAGES.INTERNAL_ERROR });
  }
};

/**
 * ดึงข้อมูลผู้ใช้ (เพิ่มเติม)
 */
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
