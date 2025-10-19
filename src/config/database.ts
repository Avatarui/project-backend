import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 20000,
  timezone: '+07:00', // 🇹🇭 แสดงผลเวลาตามไทยเมื่อ SELECT
  ssl: {
    ca: fs.readFileSync(path.join(__dirname, '../../isrgrootx1.pem')),
  },
});

// 🇹🇭 ตั้ง timezone ของ session ใน DB ทุกครั้งที่เริ่มต้น
(async () => {
  try {
    const connection = await pool.getConnection();
    await connection.query("SET time_zone = '+07:00'");
    connection.release();
    console.log('✅ MySQL timezone set to +07:00 (Asia/Bangkok)');
  } catch (err) {
    console.error('⚠️ Failed to set timezone:', err);
  }
})();

export default pool;
