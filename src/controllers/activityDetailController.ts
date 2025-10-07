// controllers/activityDetailController.ts
import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import * as activityDetailService from "../services/activityDetailService";
import { ActivityHistoryService } from "../services/activityHistoryService";
import { getDailyOverallPercent } from "../services/activityDetailService";

// เพิ่มกิจกรรม
export const addActivityDetail = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid;
  const { act_id, goal, unit, round, message, time_remind } = req.body;
  const missingFields: string[] = [];
  if (
    !uid ||
    !act_id ||
    goal === undefined ||
    !unit ||
    round === undefined ||
    !message
  ) {
    if (!uid) missingFields.push("uid");
    if (!act_id) missingFields.push("act_id");
    if (goal === undefined) missingFields.push("goal");
    if (!unit) missingFields.push("unit");
    if (round === undefined) missingFields.push("round");
    if (!message) missingFields.push("message");
    return res.status(400).json({
      message: "Missing required fields",
      missing: missingFields,
    });
  }

  try {
    const act_detail_id = await activityDetailService.insertActivityDetail({
      uid,
      act_id,
      goal,
      unit,
      round,
      message,
      time_remind: time_remind ?? [],
    });

    return res.status(201).json({
      message: "Activity detail added successfully",
      act_detail_id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ลบกิจกรรม
export const deleteActivityDetail = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid;
  const act_detail_id = req.query.act_detail_id as string;
  console.log("🔍 act_detail_id =", req.query.act_detail_id);

  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  if (!act_detail_id)
    return res.status(400).json({ message: "act_detail_id query required" });

  try {
    const affectedRows = await activityDetailService.deleteActivityDetailById(
      uid,
      act_detail_id
    );
    if (!affectedRows)
      return res.status(404).json({ message: "Activity detail not found" });
    return res
      .status(200)
      .json({ message: "Activity detail deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// รายการของฉัน
export const getMyActivityDetails = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ message: "Unauthorized" });

  try {
    // ดึงกิจกรรมทั้งหมดของ user ที่ยังไม่หมดรอบ และยังไม่ครบ goal
    const rows = await activityDetailService.getActivityDetailsWithMaster(uid);
    return res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getTodayCurrentValue = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid;
  const act_detail_id = req.query.act_detail_id as string;

  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  if (!act_detail_id) {
    return res.status(400).json({ message: "act_detail_id query required" });
  }

  try {
    const current = await ActivityHistoryService.getTodayActionSum(
      uid,
      act_detail_id
    );

    return res.status(200).json({
      act_detail_id,
      current_value: current,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ดูรายละเอียด 1 รายการ (query parameter)
export const getActivityDetailById = async (
  req: AuthRequest,
  res: Response
) => {
  const uid = req.user?.uid;
  const act_detail_id = req.query.act_detail_id as string;
  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  if (!act_detail_id)
    return res.status(400).json({ message: "act_detail_id query required" });

  try {
    const row = await activityDetailService.getActivityDetailByIdAndUid(
      uid,
      act_detail_id
    );
    if (!row)
      return res.status(404).json({ message: "Activity detail not found" });
    return res.status(200).json(row);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// updateCurrentValue (query parameter)
export const updateCurrentValue = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid;
  const act_detail_id = req.query.act_detail_id as string;
  const { current_value } = req.body;
  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  if (!act_detail_id)
    return res.status(400).json({ message: "act_detail_id query required" });

  const newVal = Number(current_value);
  if (Number.isNaN(newVal) || newVal < 0)
    return res.status(400).json({ message: "current_value invalid" });

  try {
    const row = await activityDetailService.getCurrentAndGoal(
      uid,
      act_detail_id
    );
    if (!row)
      return res.status(404).json({ message: "Activity detail not found" });

    const goal = row.goal != null ? Number(row.goal) : null;
    const capped = goal ? Math.min(newVal, goal) : newVal;

    const affectedRows = await activityDetailService.updateCurrentValueByUid(
      uid,
      act_detail_id,
      capped
    );
    if (!affectedRows)
      return res.status(404).json({ message: "Activity detail not found" });

    const after = await activityDetailService.getActivityDetailByIdAndUid(
      uid,
      act_detail_id
    );
    return res.status(200).json(after);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getDailyOverallPercentController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const uid = req.user?.uid;
    console.log("User ID from token:", uid);
    if (!uid) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const data = await getDailyOverallPercent(uid);
    return res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching daily overall percent:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
