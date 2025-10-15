// controllers/actionlogController.ts
import { AuthRequest } from "../middlewares/auth";
import { Response } from "express";
import { ActionLogRow, ActionLogService, LatestTargetRow } from "../services/actionLogService";
export const getLatestTargets = async (_req: AuthRequest, res: Response) => {
  try {
    const data: LatestTargetRow[] = await ActionLogService.getLatestTargetsWithReason();
    return res.status(200).json({ data });
  } catch (e) {
    console.error("getLatestTargets error:", e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getActionLogById = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.actionId);
    if (!Number.isFinite(id) || id < 1) {
      return res.status(400).json({ error: "Invalid action_id" });
    }
    const row = await ActionLogService.getActionLogById(id);
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ data: row });
  } catch (e) {
    console.error("getActionLogById error:", e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};