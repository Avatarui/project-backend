import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { ActivityHistoryBody } from "../types/activityHistory.types";
import { ActivityHistoryService } from "../services/activityHistoryService";

export const addActivityHistory = async (
  req: AuthRequest<{}, {}, ActivityHistoryBody>,
  res: Response
) => {
  const { act_detail_id, uid, action, value_done } = req.body;

  if (
    !act_detail_id ||
    !uid ||
    action === undefined ||
    value_done === undefined
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (req.user?.role === "member" && req.user.uid !== uid) {
    return res
      .status(403)
      .json({ message: "Forbidden: cannot add history for other users" });
  }

  try {
    const historyId = await ActivityHistoryService.addHistory(req.body);
    res.status(201).json({
      message: "Activity history added successfully",
      history_id: historyId,
    });
  } catch (error) {
    console.error("Error inserting activity history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const increaseCurrentValue = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid;
  const act_detail_id = req.query.act_detail_id as string;
  const { action } = req.body;

  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  if (!act_detail_id) {
    return res.status(400).json({ message: "act_detail_id query required" });
  }

  const act = Number(action);
  if (Number.isNaN(act) || act <= 0) {
    return res.status(400).json({ message: "action must be positive" });
  }

  try {
    // 1) insert ลง activity_history
    await ActivityHistoryService.insertActivityHistory(uid, act_detail_id, act);

    // 2) คำนวณ sum(action) เฉพาะวันนี้
    const todaySum = await ActivityHistoryService.getTodayActionSum(
      uid,
      act_detail_id
    );

    // 3) ดึง goal
    const goal = await ActivityHistoryService.getGoal(uid, act_detail_id);

    // 4) คำนวณ percent
    const percent = goal ? Math.min((todaySum / goal) * 100, 100) : null;

    return res.status(200).json({
      act_detail_id,
      todaySum,
      goal,
      percent,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const updateLatestAction = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid;
  const act_detail_id = req.query.act_detail_id as string;
  const { action } = req.body;

  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  if (!act_detail_id)
    return res.status(400).json({ message: "act_detail_id query required" });

  const act = Number(action);
  if (Number.isNaN(act) || act < 0)
    return res.status(400).json({ message: "action must be ≥ 0" });

  try {
    // 1) ดึง record ล่าสุด
    const latest = await ActivityHistoryService.getLatestHistory(
      uid,
      act_detail_id
    );

    // 2) ลบ record ล่าสุดถ้ามี
    if (latest?.history_id) {
      await ActivityHistoryService.deleteHistoryById(latest.history_id);
    }

    // 3) เพิ่มค่าใหม่ลง activity_history
    if (act > 0) {
      await ActivityHistoryService.insertActivityHistory(
        uid,
        act_detail_id,
        act
      );
    }

    // 4) คำนวณ sum(action) ของวันนี้
    const todaySum = await ActivityHistoryService.getTodayActionSum(
      uid,
      act_detail_id
    );

    // 5) ดึง goal
    const goal = await ActivityHistoryService.getGoal(uid, act_detail_id);

    // 6) คำนวณ percent
    const percent = goal ? Math.min((todaySum / goal) * 100, 100) : null;

    return res.status(200).json({
      act_detail_id,
      todaySum,
      goal,
      percent,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const getTodaySum = async (req: AuthRequest, res: Response) => {
  const uid = req.query.uid as string;
  const act_detail_id = req.query.act_detail_id as string;

  if (!uid || !act_detail_id) {
    return res.status(400).json({ message: "uid and act_detail_id required" });
  }

  try {
    const todaySum = await ActivityHistoryService.getTodayActionSum(uid, act_detail_id);
    const goal = await ActivityHistoryService.getGoal(uid, act_detail_id);

    const percent = goal ? Math.min((todaySum / goal) * 100, 100) : null;

    return res.status(200).json({
      act_detail_id,
      todaySum,
      goal,
      percent,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};