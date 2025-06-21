import admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase/auth';
import dotenv from 'dotenv';
dotenv.config();

const serviceAccount = require("../finalproject-609a4-firebase-adminsdk-fbsvc-e4975b201d.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_BUCKET,
  });
  
  export const auth = admin.auth();
  export const db = admin.firestore();
  export const bucket = admin.storage().bucket();
