import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  getAllUsers,
  registerValidation,
  loginValidation,
  adminRegister
} from '../controller/authController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/adminregister', registerValidation, adminRegister);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.get('/users', authenticateToken, requireAdmin, getAllUsers);

export default router;

