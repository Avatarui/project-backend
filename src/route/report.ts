import { Router } from "express";
import { sendReport,getReport } from "../controller/reportController";
const router = Router();

router.post("/sendReport",sendReport);
router.get("/getReport",getReport);

export default router;