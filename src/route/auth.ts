import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  getAllUsers,
  registerValidation,
  loginValidation,
  adminRegister,
  verifyToken
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

router.post('/adminregister', registerValidation, adminRegister);
router.post(
  '/registerwithemailpassword',
  upload.single('profileImage'),   // multer middleware รับไฟล์
  registerValidation,              // ตรวจสอบข้อมูล
  register                        // controller ที่แก้ไขแล้ว
);

router.post('/login', loginValidation, login);
router.post('/verify-token', verifyToken);
// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.get('/users', authenticateToken, requireAdmin, getAllUsers);

export default router;

