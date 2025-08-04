import pool from '../config/database';
import { User, UserRegister } from '../types/user';

export class UserModel {
  static async findByUsername(username: string): Promise<User | null> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM user WHERE username = ?',
        [username]
      );
      const users = rows as User[];
      return users.length > 0 ? users[0] : null;
    } finally {
      connection.release();
    }
  }

  static async findById(id: number): Promise<User | null> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM user WHERE userID = ?',
        [id]
      );
      const users = rows as User[];
      return users.length > 0 ? users[0] : null;
    } finally {
      connection.release();
    }
  }

  static async create(userData: UserRegister): Promise<number> {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'INSERT INTO user (username, password, usertype) VALUES (?, ?, ?)',
        [userData.username, userData.password, userData.usertype || 'member']
      );
      return (result as any).insertId;
    } finally {
      connection.release();
    }
  }

  static async getAllUsers(): Promise<User[]> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT userID, username, usertype FROM user'
      );
      return rows as User[];
    } finally {
      connection.release();
    }
  }
}
