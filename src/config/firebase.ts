import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

const required = [
  'FIREBASE_TYPE',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_CLIENT_ID',
  'FIREBASE_AUTH_URI',
  'FIREBASE_TOKEN_URI',
  'FIREBASE_AUTH_PROVIDER_CERT_URL',
  'FIREBASE_CLIENT_CERT_URL',
];

const missing = required.filter((k) => !process.env[k] || process.env[k] === '');
if (missing.length) {
  throw new Error(`Missing ENV: ${missing.join(', ')}`);
}

// ถ้า PRIVATE_KEY เป็น single-line ที่มี \n ให้ใช้ replace; ถ้าใส่แบบ multi-line ใน Render ให้ไม่ต้อง replace
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.includes('\\n')
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : process.env.FIREBASE_PRIVATE_KEY;

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: privateKey,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
} as admin.ServiceAccount;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  // storageBucket: process.env.FIREBASE_BUCKET,
});

export const auth = admin.auth();
export const db = admin.firestore();
export const bucket = admin.storage().bucket();
