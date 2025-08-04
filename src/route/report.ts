import { Router } from "express";
import { sendReport,getReport } from "../controller/reportController";
const router = Router();

router.post("/sendReport",sendReport);
router.post("/getReport",getReport);

export default router;