import { AuthRequest } from "../middlewares/auth";
import { Response } from "express";
import * as activityService from "../services/activityService";

/**
 * CREATE activity แบบเก็บใน firebase
 */

export const createActivity = async (req: AuthRequest, res: Response) => {
  const { cate_id, act_name, act_pic } = req.body;

  // ดึง uid จาก token (middleware authenticateToken ต้องใส่ก่อน)
  const uid = req.user?.uid;

  if (!uid || !cate_id || !act_name || !act_pic) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // ตรวจว่าหมวดหมู่ของ user มีอยู่จริงหรือไม่
    const exists = await activityService.checkCategoryExists(cate_id, uid);
    if (!exists) {
      return res.status(404).json({ message: "Category not found" });
    }

    await activityService.createActivityDB(uid, cate_id, act_name, act_pic);
    return res.status(200).json({ message: "Activity created successfully" });
  } catch (error) {
    console.error("Error creating activity:", error);
    return res.status(500).json({ message: "Database error" });
  }
};


/**
 * READ activities
 */
export const getActivities = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role; // จาก middleware
    const uid = req.user?.uid; // จาก middleware
    const raw = req.query.cate_id as string | undefined;
    // console.log(role, uid, raw);
    if (!role || !uid)
      return res.status(401).json({ message: "Unauthenticated" });
    if (!raw) return res.status(400).json({ message: "cate_id is required" });

    const cateId = raw;
    const rows = await activityService.getActivitiesDB(role, uid, cateId);
    return res.status(200).json(rows);
  } catch (error) {
    console.error(
      "Error fetching activities:",
      { user: req.user, q: req.query },
      error
    );
    return res.status(500).json({ message: "Database error" });
  }
};

export const deleteActivity = async (req: AuthRequest, res: Response) => {
  const { act_id } = req.body;                // <- uid ไม่ต้อง
  const role = req.user?.role;
  const uid = req.user?.uid;

  if (!act_id) return res.status(400).json({ message: "Missing required fields" });

  try {
    const allowed = await activityService.checkActivityPermission(act_id, uid, role);
    if (!allowed) return res.status(404).json({ message: "Activity not found or no permission" });

    await activityService.deleteActivityDB(act_id, uid, role);
    return res.status(200).json({ message: "Activity deleted successfully" });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return res.status(500).json({ message: "Database error" });
  }
};

export const updateActivity = async (req: AuthRequest, res: Response) => {
  const { act_id, act_name, act_pic } = req.body;  // <- uid ไม่ต้อง
  const role = req.user?.role;
  const uid = req.user?.uid;

  if (!act_id || !act_name || !act_pic)
    return res.status(400).json({ message: "Missing required fields" });

  try {
    const allowed = await activityService.checkActivityPermission(act_id, uid, role);
    if (!allowed) return res.status(404).json({ message: "Activity not found or no permission" });

    await activityService.updateActivityDB(act_id, act_name, act_pic, uid, role);
    return res.status(200).json({ message: "Activity updated successfully" });
  } catch (error) {
    console.error("Error updating activity:", error);
    return res.status(500).json({ message: "Database error" });
  }
};

export const countActivities = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    const authUid = req.user?.uid;
    if (!role || !authUid) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    // ถ้าเป็น admin และมีการส่ง ?uid= เป้าหมายมา ให้ใช้ uid นั้น
    let targetUid = authUid;
    const qUid = req.query.uid;
    if (role === "admin" && typeof qUid === "string" && qUid.trim().length > 0) {
      targetUid = qUid.trim();
    }

    const count = await activityService.countActivitiesDB(targetUid);
    return res.status(200).json({ uid: targetUid, total_activities: count });
  } catch (error) {
    console.error("Error counting activities:", { user: req.user }, error);
    return res.status(500).json({ message: "Database error" });
  }
};

export const getActivitySummary = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    const uid = req.user?.uid;
    if (!role || !uid) return res.status(401).json({ message: "Unauthenticated" });

    const summary = await activityService.getActivitySummaryDB(uid);
    return res.status(200).json(summary);
  } catch (error) {
    console.error("Error fetching activity summary:", { user: req.user }, error);
    return res.status(500).json({ message: "Database error" });
  }
};