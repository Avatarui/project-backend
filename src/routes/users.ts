import { Router } from "express";
import { editUserInfo, changeUserStatus, updateMyStatus, getUserInfo } from "../controllers/userController";
import { authenticateToken, adminAuthenticateToken } from "../middlewares/auth";

const router = Router();

// Member route: edit user info
router.put("/edit", authenticateToken, editUserInfo);
router.post("/mystatus", authenticateToken, updateMyStatus);

// Admin route: change user status
router.put("/changeStatus", adminAuthenticateToken, changeUserStatus);
router.get("/:uid", authenticateToken, getUserInfo);

export default router;
