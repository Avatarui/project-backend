import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import { UserModel } from '../model/User';
import pool from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    displayName: string;
    role: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    // ✅ Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // ✅ Fetch user role from MySQL using UID
    const [results]: any = await pool.query(
      'SELECT role FROM users WHERE uid = ?',
      [decodedToken.uid]
    );

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(404).json({ message: 'User not found in database' });
    }

    const role = results[0].role;

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      displayName: decodedToken.name || '',
      role,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};



export const adminauthenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    // เปลี่ยนจาก jwt.verify มาเป็น verifyIdToken ของ Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);

    // ใช้ uid จาก decodedToken ดึงข้อมูลจาก MySQL
    const [results]: any = await pool.query('SELECT role FROM users WHERE uid = ?', [decodedToken.uid]);
    const role = results.length > 0 ? results[0].role : 'admin';

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      displayName: decodedToken.name || '',
      role,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
