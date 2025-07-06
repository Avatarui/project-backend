import { Request, Response } from 'express';
import { Category } from '../types/category';
import pool from '../config/database';

export const createCategory = async (req: Request, res: Response) => {
  const { uid, cate_name, cate_pic } = req.body;

  if (!uid || !cate_name || !cate_pic) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await pool.execute(
      'INSERT INTO category (uid, cate_name, cate_pic) VALUES (?, ?, ?)',
      [uid, cate_name, cate_pic]
    );

    return res.status(200).json({ message: 'Category created successfully' });
  } catch (error) {
    console.error('Error inserting category:', error);
    return res.status(500).json({ message: 'Database error' });
  }
};

export const getCategory = async (req: Request, res: Response) => {
  const uid = req.query.uid as string;

  if (!uid) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM category WHERE uid = ?',
      [uid]
    );
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching category:', error);
    return res.status(500).json({ message: 'Database error' });
  }
};
