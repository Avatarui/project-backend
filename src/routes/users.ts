import { Router } from "express";
import { editUserInfo, changeUserStatus, updateMyStatus, getUserInfo, getUsernamesByUids } from "../controllers/userController";
import { authenticateToken, requireAdmin } from "../middlewares/auth";

const router = Router();
router.use(authenticateToken);
// Member route: edit user info
router.put("/edit", editUserInfo);
router.post("/mystatus" , updateMyStatus);

// Admin route: change user status
router.put("/changeStatus", requireAdmin, changeUserStatus);
router.get("/:uid", getUserInfo);
router.post("/usernames", getUsernamesByUids);

export default router;
