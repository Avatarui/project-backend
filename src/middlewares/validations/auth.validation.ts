import { body } from "express-validator";

export const registerValidation = [
  body("username")
    .isLength({ min: 3, max: 100 })
    .withMessage("Name must be between 3 and 100 characters"),
  body("email")
    .isEmail()
    .isLength({ max: 255 })
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("usertype")
    .optional()
    .isLength({ max: 20 })
    .withMessage("User type must not exceed 20 characters"),
];

export const loginValidation = [
  body("email").notEmpty().withMessage("Email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const adminRegisterValidation = [
  body("username")
    .isLength({ min: 3, max: 100 })
    .withMessage("Username must be between 3 and 100 characters"),
  body("email")
    .isEmail()
    .isLength({ max: 255 })
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];