import { Request, Response, NextFunction } from "express";

export const validateCreateExpectation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { act_id, uid, user_exp } = req.body;

  if (!act_id || !uid || user_exp == null) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  next();
};

export const validateGetExpectation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const uid = req.query.uid as string;
  if (!uid) {
    return res.status(400).json({ message: "Missing uid" });
  }
  next();
};
