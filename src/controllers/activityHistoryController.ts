import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { ActivityHistoryBody } from "../types/activityHistory.types";
import { ActivityHistoryService } from "../services/activityHistoryService";

export const addActivityHistory = async (
  req: AuthRequest<{}, {}, ActivityHistoryBody>,
  res: Response
) => {
  const { act_detail_id, uid, action, value_done } = req.body;

  if (!act_detail_id || !uid || action === undefined || value_done === undefined) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (req.user?.role === "member" && req.user.uid !== uid) {
    return res.status(403).json({ message: "Forbidden: cannot add history for other users" });
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
