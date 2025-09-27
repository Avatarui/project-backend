import { Request, Response } from "express";
import {
  createExpectationService,
  getExpectationsByUserService,
  checkExpectationDB,
  getExpectationsByActIdAndUser
} from "../services/expectationService";
import { ExpectationBody } from "../types/expectation";

// CREATE
export const createExpectation = async (req: Request, res: Response) => {
  const { act_id, uid, user_exp } = req.body as ExpectationBody;

  try {
    const exp_id = await createExpectationService({ act_id, uid, user_exp });
    res.status(200).json({ message: "Expectation created successfully", exp_id });
  } catch (error) {
    console.error("Error creating expectation:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// READ
export const getExpectationsByUser = async (req: Request, res: Response) => {
  const uid = req.query.uid as string;
  const actId = req.query.act_id as string;

  if (!uid || !actId) {
    return res.status(400).json({ message: "uid and act_id are required" });
  }

  try {
    const rows = await getExpectationsByUserService(uid, actId);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching expectations:", error);
    res.status(500).json({ message: "Database error" });
  }
};

export const checkExpectationByActId = async (req: Request, res: Response) => {
  const { act_id, uid } = req.body;

  if (!act_id || !uid) return res.status(400).json({ message: "act_id and uid are required" });

  try {
    const exists = await checkExpectationDB(act_id, uid); // ปรับ service ให้รับ uid ด้วย
    let userExp = null;

    if (exists) {
      const expectations = await getExpectationsByActIdAndUser(act_id, uid);
      userExp = expectations.user_exp;
    }

    return res.status(200).json({ exists, user_exp: userExp });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Database error" });
  }
};