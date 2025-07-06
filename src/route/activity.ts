import { Router } from 'express';
import multer from 'multer';
import { createActivity, getActivity } from '../controller/activityController';
const upload = multer({
    storage: multer.memoryStorage(), // เก็บไฟล์ใน RAM ชั่วคราว
    limits: { fileSize: 5 * 1024 * 1024 }, // ขนาดสูงสุด 5MB
  });
  const router = Router();
  router.post(
    '/createAct',
    upload.single('cateImage'),   // multer middleware รับไฟล์
    createActivity                        // controller ที่แก้ไขแล้ว
  );
  router.get(
    '/getAct',
    getActivity                        // controller ที่แก้ไขแล้ว
  );

  export default router;