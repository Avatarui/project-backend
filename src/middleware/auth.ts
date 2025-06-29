import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import { UserModel } from '../model/User';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    displayName?: string;
    usertype: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!); // หรือเป็น JwtPayload ถ้าคุณใช้
    const userRecord = await admin.auth().getUser(decoded.userId);
    const userDoc = await admin.firestore().collection('users').doc(userRecord.uid).get();

    const usertype = userDoc.data()?.role ?? 'member'; 
 
    
    req.user = {
      uid: userRecord.uid,
      email: userRecord.email || '',
      displayName: userRecord.displayName || '',
      usertype: usertype,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.usertype !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
