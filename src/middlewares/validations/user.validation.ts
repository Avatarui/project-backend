import { body, param } from "express-validator";

export const editUserInfoValidation = [
  body("uid")
    .notEmpty()
    .withMessage("UID is required")
    .isLength({ min: 1, max: 128 })
    .withMessage("Invalid UID format"),
  body("username")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Username must be between 2-100 characters"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("birthday")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Birthday must be in YYYY-MM-DD format"),
];

export const changeUserStatusValidation = [
  body("uid")
    .notEmpty()
    .withMessage("UID is required"),
  body("status")
    .isIn(['active', 'suspended', 'deleted'])
    .withMessage("Status must be 'active', 'suspended', or 'deleted'"),
];

export const updateMyStatusValidation = [
  body("status")
    .isIn(['active', 'suspended'])
    .withMessage("Status must be 'active' or 'suspended'"),
];
