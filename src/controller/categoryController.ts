import { Request, Response } from 'express';
import pool from '../config/database';


export const getCategory = async (req: Request, res: Response) => {
  const uid = req.query.uid as string;

  if (!uid) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM category WHERE uid IN (?, (SELECT uid FROM users WHERE role = "admin"))',
      [uid] 
    );
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching category:', error);
    return res.status(500).json({ message: 'Database error' });
  }
};
