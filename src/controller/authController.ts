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

    const { username, password, usertype }: UserRegister = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = await UserModel.create({
      username,
      password: hashedPassword,
      usertype: usertype || "member" 
    });

    res.status(201).json({
      message: 'User registered successfully',
      userId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const adminRegister = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, usertype }: UserRegister = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = await UserModel.create({
      username,
      password: hashedPassword,
      usertype: usertype || "admin" 
    });

    res.status(201).json({
      message: 'User registered successfully',
      userId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
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