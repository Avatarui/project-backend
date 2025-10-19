// controllers/activityHistoryController.ts
import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { ActivityHistoryBody } from "../types/activityHistory.types";
import { ActivityHistoryService } from "../services/activityHistoryService";

// เพิ่ม history
export const addActivityHistory = async (
  req: AuthRequest<{}, {}, ActivityHistoryBody>,
  res: Response
) => {
  const { act_detail_id, action, value_done } = req.body;
  const uid = req.user?.uid;

  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  if (!act_detail_id || action === undefined) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const historyId = await ActivityHistoryService.addHistory({
      uid,
      act_detail_id,
      action,
      value_done,
    });
    return res.status(201).json({
      message: "Activity history added successfully",
      history_id: historyId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// เพิ่ม action และคำนวณ percent
export const increaseCurrentValue = async (
  req: AuthRequest<{}, {}, ActivityHistoryBody>,
  res: Response
) => {
  const { act_detail_id, action } = req.body;
  const uid = req.user?.uid;

  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  if (!act_detail_id)
    return res.status(400).json({ message: "act_detail_id required" });

  const act = Number(action);
  if (Number.isNaN(act) || act <= 0)
    return res.status(400).json({ message: "action must be positive" });

  try {
    await ActivityHistoryService.insertActivityHistory(uid, act_detail_id, act);
    const todaySum = await ActivityHistoryService.getTodayActionSum(
      uid,
      act_detail_id
    );
    const goal = await ActivityHistoryService.getGoal(uid, act_detail_id);
    const percent = goal ? Math.min((todaySum / goal) * 100, 100) : null;

    return res.status(200).json({ act_detail_id, todaySum, goal, percent });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// update latest action
export const updateLatestAction = async (
  req: AuthRequest<{}, {}, ActivityHistoryBody>,
  res: Response
) => {
  const { act_detail_id, action } = req.body;
  const uid = req.user?.uid;

  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  if (!act_detail_id) return res.status(400).json({ message: "act_detail_id required" });

  const act = Number(action);
  if (Number.isNaN(act) || act < 0)
    return res.status(400).json({ message: "action must be ≥ 0" });

  try {
    // 1️⃣ หา record ล่าสุดของ "วันนี้"
    const latestToday = await ActivityHistoryService.getLatestHistoryToday(uid, act_detail_id);

    if (latestToday) {
      // 2️⃣ ถ้ามี → อัปเดตค่า action แถวนี้
      await ActivityHistoryService.updateHistoryActionById(latestToday.history_id, act);
    } else {
      // 3️⃣ ถ้ายังไม่มี → แทรกใหม่วันนี้
      if (act > 0) {
        await ActivityHistoryService.insertActivityHistory(uid, act_detail_id, act);
      }
    }

    // 4️⃣ รวมผลวันนี้ + เป้า
    const todaySum = await ActivityHistoryService.getTodayActionSum(uid, act_detail_id);
    const goal = await ActivityHistoryService.getGoal(uid, act_detail_id);
    const percent = goal ? Math.min((todaySum / goal) * 100, 100) : null;

    // ✅ ส่งชื่อฟิลด์ให้ตรงกับ Flutter
    return res.status(200).json({
      act_detail_id,
      current_value: todaySum,
      goal,
      percent,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// ดึง percent/ todaySum
export const getTodaySum = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid; // ดึงจาก token เลย
  const act_detail_id = req.query.act_detail_id as string;

  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  if (!act_detail_id)
    return res.status(400).json({ message: "act_detail_id required" });

  try {
    const todaySum = await ActivityHistoryService.getTodayActionSum(
      uid,
      act_detail_id
    );
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
export const getDailyPercent = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid; // รับจาก idToken แล้ว
  const act_detail_id = req.query.act_detail_id as string;

  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  if (!act_detail_id)
    return res.status(400).json({ message: "act_detail_id required" });

  try {
    const data = await ActivityHistoryService.getDailyPercent(uid, act_detail_id);
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// controllers/activityHistoryController.ts
export const getLatestActionValue = async (
  req: AuthRequest<{}, {}, {}>,
  res: Response
) => {
  const uid = req.user?.uid;

  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  if (!req.query.act_detail_id) {
    return res.status(400).json({ message: "act_detail_id required" });
  }

  // รองรับกรณี query เป็น string[] จาก Express
  const actDetailIdRaw = Array.isArray(req.query.act_detail_id)
    ? req.query.act_detail_id[0]
    : req.query.act_detail_id;

  // แปลงเป็น string ให้ชัดเจน (ถ้าฐานเป็น number ก็ส่ง number ได้เช่นกัน)
  const actDetailId: string = String(actDetailIdRaw);

  try {
    // ✅ ดึงเฉพาะ "ล่าสุดของวันนี้"
    const latestToday = await ActivityHistoryService.getLatestHistoryToday(uid, actDetailId);

    return res.status(200).json({
      act_detail_id: actDetailId,
      latestAction: latestToday?.action ?? 0,
      createdAt: latestToday?.create_at ?? null,
      scope: "today", // บอกให้ชัดว่าเป็นข้อมูลของวันนี้
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

