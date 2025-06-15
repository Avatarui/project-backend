import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'frank1',
  password: process.env.DB_PASSWORD || '123a',
  database: process.env.DB_NAME || 'loginsystem'
};

export const createConnection = async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');
    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};
