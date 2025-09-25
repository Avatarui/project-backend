import { Router } from 'express';
import {
  register,
  loginWithEmail,
  getProfile,
  getAllUsers,
  adminRegister,
  loginWithGoogle,
  getUserRole
} from '../controllers/authController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { registerValidation } from "../middlewares/validations/auth.validation";
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(), // เก็บไฟล์ใน RAM ชั่วคราว
  limits: { fileSize: 5 * 1024 * 1024 }, // ขนาดสูงสุด 5MB
});

const router = Router();

router.post('/adminregister', registerValidation, adminRegister);
router.post(
  '/registerwithemailpassword',
  upload.single('profileImage'),   
  registerValidation,              
  register                        
);

router.post('/loginwithemail', loginWithEmail);
router.post('/loginwithgoogle', loginWithGoogle);
// Protected routes
router.get('/getProfile',authenticateToken, getProfile);
router.get('/users', getAllUsers);
router.get('/getRole', getUserRole);


export default router;

