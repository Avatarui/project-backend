import { Router } from "express";
import { 
  editUserInfo,
  changeStatus 
} from "../controller/usersController";
const router = Router();
router.put("/users/edit", editUserInfo);
router.put("/users/changeStatus", changeStatus);
export default router;