import { Request, Response } from "express";
import {
  createExpectationService,
  getExpectationsByUserService,
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

  try {
    const rows = await getExpectationsByUserService(uid);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching expectations:", error);
    res.status(500).json({ message: "Database error" });
  }
};
