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
    
    // --- แก้ไขตรงนี้: ใช้ Nullish Coalescing Operator (??) ---
    // บรรทัด 35 และ 36 จะถูกแทนที่ด้วยบรรทัดเดียวนี้
    const usertype = userDoc.data()?.role ?? 'member'; 
    // อธิบาย:
    // 1. userDoc.data()?.role: พยายามเข้าถึง 'role' property จาก data ของเอกสาร
    //    - ถ้า userDoc.data() เป็น null/undefined, หรือไม่มี 'role' property, ผลลัพธ์จะเป็น undefined
    // 2. ?? 'member': ถ้าผลลัพธ์จากด้านซ้ายเป็น null หรือ undefined, ให้ใช้ค่า 'member' แทน

    // หรือใช้แบบ if statement แบบเดิมก็ได้ (ถ้าคุณชอบแบบนี้มากกว่า)
    // let usertype = 'member';
    // if (userDoc.exists && userDoc.data()?.role) { // บรรทัด 35 ของคุณจะถูกแก้ไขเป็นแบบนี้
    //     usertype = userDoc.data()!.role;         // บรรทัด 36 ของคุณจะถูกแก้ไขเป็นแบบนี้
    // }
    
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
