import { AuthRequest } from "../middlewares/auth";
import { Response } from "express";
import * as activityService from "../services/activityService";

/**
 * CREATE activity แบบเก็บใน firebase
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


// export const createActivity = async (req: AuthRequest, res: Response) => {
//   try {
//     console.log("req.user:", req.user);
//     console.log("req.body:", req.body);
//     console.log("req.file:", req.file);

//     const { act_name, cate_id } = req.body;
//     const uid = req.user?.uid;

//     // ตรวจสอบทุก field
//     if (!uid || !cate_id || !act_name) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     if (!req.file) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     const act_pic = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

//     await activityService.createActivityDB(uid, cate_id, act_name, act_pic);

//     res.status(200).json({ message: "Activity created", act_pic });
//   } catch (error) {
//     console.error("createActivity error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

/**
 * READ activities
 */
export const getActivities = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role; // จาก middleware
    const uid = req.user?.uid; // จาก middleware
    const raw = req.query.cate_id as string | undefined;
    console.log(role, uid, raw);
    if (!role || !uid)
      return res.status(401).json({ message: "Unauthenticated" });
    if (!raw) return res.status(400).json({ message: "cate_id is required" });

    const cateId = raw;
    // if (!Number.isFinite(cateId)) {
    //   return res.status(400).json({ message: "cate_id must be a number" });
    // }

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

/**
 * UPDATE activity
 */
export const updateActivity = async (req: AuthRequest, res: Response) => {
  const { act_id, act_name, act_pic } = req.body;
  const role = req.user?.role;
  const uid = req.user?.uid;

  if (!act_id || !act_name || !act_pic)
    return res.status(400).json({ message: "Missing required fields" });

  try {
    const allowed = await activityService.checkActivityPermission(
      act_id,
      uid,
      role
    );
    if (!allowed)
      return res
        .status(404)
        .json({ message: "Activity not found or no permission" });

    await activityService.updateActivityDB(
      act_id,
      act_name,
      act_pic,
      uid,
      role
    );
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

  if (!act_id)
    return res.status(400).json({ message: "Missing required fields" });

  try {
    const allowed = await activityService.checkActivityPermission(
      act_id,
      uid,
      role
    );
    if (!allowed)
      return res
        .status(404)
        .json({ message: "Activity not found or no permission" });

    await activityService.deleteActivityDB(act_id, uid, role);
    return res.status(200).json({ message: "Activity deleted successfully" });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return res.status(500).json({ message: "Database error" });
  }
};
