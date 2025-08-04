import { Request, Response, Router } from "express";
import pool from "../config/database";

interface ActivityHistoryBody {
  act_detail_id: number;
  uid: string;
  action: number;
  value_done: number;
}

export const addActivityHistory = async (
  req: Request<{}, {}, ActivityHistoryBody>,
  res: Response
) => {
  const { act_detail_id, uid, action, value_done } = req.body;

  if (!act_detail_id || !uid || action === undefined || value_done === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO activity_history 
        (act_detail_id, uid, action, value_done)
       VALUES (?, ?, ?, ?)`,
      [act_detail_id, uid, action, value_done]
    );

    res.status(201).json({
      message: 'Activity history added successfully',
      history_id: (result as any).insertId,
    });
  } catch (error) {
    console.error('Error inserting activity history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
