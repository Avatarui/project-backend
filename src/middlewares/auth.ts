import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { getUserByUID } from '../models/User';
import { User } from '../types/user.types';
import { log } from 'console';

export interface AuthRequest<P = any, ResBody = any, ReqBody = any> extends Request<P, ResBody, ReqBody> {
  user?: User;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  console.log(token)

  if (!token) return res.status(401).json({ message: 'Access token required' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    const userFromDB = await getUserByUID(decodedToken.uid);
    if (!userFromDB) return res.status(404).json({ message: 'User not found in database' });

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      username: decodedToken.name || '',
      status: userFromDB.status as 'active' | 'suspended' | 'deleted',
      role: userFromDB.role as 'admin' | 'member',
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const adminAuthenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  await authenticateToken(req, res, async () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
};

