import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { UserLogin, UserRegister } from '../types/user';
import router from '../route/auth';
import admin from 'firebase-admin';
import { UserModel } from '../model/User';

export const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('usertype')
    .optional()
    .isIn(['admin', 'member'])
    .withMessage('User type must be either admin or member')
];

export const loginValidation = [
  body('username').notEmpty().withMessage('Username is required'),
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
      photoURL: userRecord.photoURL || '',
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
// controller/authController.ts
// import { Request, Response } from 'express';
// import admin from 'firebase-admin';

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];

    if (!idToken) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // ✅ ตรวจสอบ idToken
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // ✅ ตรวจว่ามีผู้ใช้นี้ใน Firestore ไหม
    const userDoc = await admin.firestore().collection('users').doc(uid).get();

    if (!userDoc.exists) {
      // 🔥 สร้างเอกสารใหม่ (ข้อมูลมาจาก body)
      const { email, displayName, photoURL } = req.body;

      await admin.firestore().collection('users').doc(uid).set({
        email,
        name: displayName,
        photoURL,
        role: 'member',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.status(200).json({
      message: 'Token verified and user exists',
      uid,
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};


export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password }: UserLogin = req.body;

    // Find user
    const user = await UserModel.findByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.userID, username: user.username, usertype: user.usertype },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        userID: user.userID,
        username: user.username,
        usertype: user.usertype
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
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

// router.post('/verify-token', async (req, res) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader?.startsWith('Bearer ')) {
//     return res.status(401).json({ error: 'Missing or invalid Authorization header' });
//   }

//   const idToken = authHeader.split('Bearer ')[1];

//   try {
//     // ✅ ตรวจสอบ Token
//     const decoded = await admin.auth().verifyIdToken(idToken);
//     const uid = decoded.uid;
//     const email = decoded.email;
//     const name = decoded.name || '';
//     const photoURL = decoded.picture || '';

//     // ✅ อัปเดต / สร้างข้อมูลใน Firestore
//     const userRef = admin.firestore().collection('users').doc(uid);
//     const userSnap = await userRef.get();

//     if (!userSnap.exists) {
//       // 👤 ถ้ายังไม่มี user ในฐานข้อมูล
//       await userRef.set({
//         email,
//         name,
//         photoURL,
//         role: 'member', // ค่าเริ่มต้น
//         createdAt: admin.firestore.FieldValue.serverTimestamp(),
//       });
//     } else {
//       // 👁 อัปเดตข้อมูลที่เปลี่ยน เช่น ชื่อ/รูป
//       await userRef.update({
//         email,
//         name,
//         photoURL,
//         lastLogin: admin.firestore.FieldValue.serverTimestamp(),
//       });
//     }

//     const userDoc = await userRef.get();
//     const userData = userDoc.data();

//     return res.status(200).json({
//       uid,
//       email,
//       name,
//       photoURL,
//       role: userData?.role || 'member',
//     });
//   } catch (err) {
//     console.error('Token verification failed:', err);
//     return res.status(401).json({ error: 'Invalid or expired token' });
//   }
// });