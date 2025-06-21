import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { UserLogin, UserRegister } from '../types/user';
import router from '../route/auth';
import admin, { auth } from 'firebase-admin';
import { UserModel } from '../model/User';
import { signInWithEmailAndPassword } from 'firebase/auth';
// import { auth } from '../config/firebase';

export const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
    body('email')
    .isLength({ min: 3, max: 50 })
    .withMessage('Email must be between 3 and 50 characters'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('usertype')
    .optional()
    .isIn(['admin', 'member'])
    .withMessage('User type must be either admin or member')
];

export const loginValidation = [
  body('email').notEmpty().withMessage('Email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, username, birthday } = req.body;
    const file = req.file;

    // สร้าง user ใน Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username,
    });

    let photoURL = '';

    // ถ้ามีไฟล์ภาพ อัปโหลดไป Firebase Storage
    if (file) {
      const bucket = admin.storage().bucket();
      const fileName = `profileImages/${userRecord.uid}_${Date.now()}`;

      const fileUpload = bucket.file(fileName);

      // อัปโหลดไฟล์จาก buffer
      await fileUpload.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
      });

      // ตั้ง public access ให้ไฟล์นี้
      await fileUpload.makePublic();

      // ได้ URL ของรูปที่อัปโหลด
      photoURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    }

    // บันทึกข้อมูลเสริมใน Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email,
      name: username,
      birthday,
      photoURL,
      role: 'member',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      message: 'User registered successfully',
      uid: userRecord.uid,
      photoURL,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const adminRegister = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, username } = req.body;

    // ✅ สร้างผู้ใช้ใน Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username,
    });

    // ✅ เพิ่มข้อมูลเสริมใน Firestore ถ้าต้องการ
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email,
      name: username,
      // photoURL: userRecord.photoURL || '',
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      message: 'User registered successfully',
      uid: userRecord.uid,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
interface JwtPayload {
  userId: string;
  usertype: string; // เพิ่ม usertype เข้าไปใน Token
  // เพิ่ม field อื่นๆ ที่ต้องการ
}
export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const userRecord = await admin.auth().getUserByEmail(email);

    // แก้ไขตรงนี้:
    const userDoc = await admin.firestore().collection('users').doc(userRecord.uid).get();
    let usertype = 'member'; // Default value

    if (userDoc.exists && userDoc.data()?.role) { // แก้ไขบรรทัด 145
        usertype = userDoc.data()!.role; // แก้ไขบรรทัด 146: ใช้ non-null assertion (!) หรือดึงค่ามาก่อน
    }
   
    const payload: JwtPayload = {
      userId: userRecord.uid,
      usertype: usertype,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });

  } catch (error: any) {
    console.error('Login error:', error);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};


export const loginwithgoogle = async (req: Request, res: Response) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];

    if (!idToken) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // ✅ ตรวจสอบ token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const usersRef = admin.firestore().collection('users');
    const userDoc = await usersRef.doc(uid).get();

    // ✅ ถ้า user ยังไม่อยู่ใน Firestore → สร้างใหม่
    if (!userDoc.exists) {
      const { email, displayName, photoURL } = req.body;

      const newUser = {
        userId: uid,
        username: displayName || '',
        email: email || '',
        password: '', // ใช้เฉพาะ email-register เท่านั้น
        birthday: '',
        telephone: '',
        role: 'member',
        photoURL: photoURL || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await usersRef.doc(uid).set(newUser);
    }

    const userData = (await usersRef.doc(uid).get()).data();

    res.status(200).json({
      message: 'Token verified and user exists',
      user: userData,
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};



export const getProfile = async (req: any, res: Response) => {
  try {
    const user = req.user;
    res.json({
      userID: user.userID,
      username: user.username,
      usertype: user.usertype
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const allUsers: admin.auth.UserRecord[] = [];
    let nextPageToken: string | undefined;

    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      allUsers.push(...listUsersResult.users);
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    // แปลงข้อมูลให้อ่านง่าย (optional)
    const users = allUsers.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
      providerData: user.providerData,
      disabled: user.disabled,
      metadata: user.metadata, // includes creation and last login timestamps
    }));

    res.status(200).json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
