import { Router } from 'express';
import {
  register,
  loginwithemail,
  getProfile,
  getAllUsers,
  registerValidation,
  loginValidation,
  adminRegister,
  loginwithgoogle
} from '../controller/authController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(), // เก็บไฟล์ใน RAM ชั่วคราว
  limits: { fileSize: 5 * 1024 * 1024 }, // ขนาดสูงสุด 5MB
});

const router = Router();

// Public routes
// router.post('/register', registerValidation, register);
// router.post('/login', loginValidation, loginwithemail);

router.post('/adminregister', registerValidation, adminRegister);
router.post(
  '/registerwithemailpassword',
  upload.single('profileImage'),   // multer middleware รับไฟล์
  registerValidation,              // ตรวจสอบข้อมูล
  register                        // controller ที่แก้ไขแล้ว
);

router.post('/loginwithemail', loginwithemail);
router.post('/loginwithgoogle', loginwithgoogle);
// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.get('/users', authenticateToken, requireAdmin, getAllUsers);

export default router;

