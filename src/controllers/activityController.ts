import { AuthRequest } from "../middlewares/auth";
import { Response } from "express";
import * as activityService from "../services/activityService";

/**
 * CREATE activity
 */
export const createActivity = async (req: AuthRequest, res: Response) => {
  const { uid: bodyUid, cate_id, act_name, act_pic } = req.body;
  const role = req.user?.role;
  const uid = role === "admin" ? bodyUid : req.user?.uid;

  if (!uid || !cate_id || !act_name || !act_pic) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const exists = await activityService.checkCategoryExists(cate_id, uid);
    if (!exists) return res.status(404).json({ message: "Category not found" });

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
  const cateId = req.query.cate_id as string | undefined;
  try {
    const rows = await activityService.getActivitiesDB(req.user?.role, req.user?.uid, cateId);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return res.status(500).json({ message: "Database error" });
  }
};

/**
 * UPDATE activity
 */
export const updateActivity = async (req: AuthRequest, res: Response) => {
  const { act_id, act_name, act_pic } = req.body;
  const role = req.user?.role;
  const uid = req.user?.uid;

  if (!act_id || !act_name || !act_pic) return res.status(400).json({ message: "Missing required fields" });

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

/**
 * DELETE activity
 */
export const deleteActivity = async (req: AuthRequest, res: Response) => {
  const { act_id } = req.body;
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
