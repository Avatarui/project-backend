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
export const deleteCategory = async (req: Request, res: Response) => {
  const { uid, cate_id } = req.body;

  if (!uid || !cate_id) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await pool.execute(
      'DELETE FROM category WHERE uid = ? AND cate_id = ?',
      [uid, cate_id]
    );

    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({ message: 'Database error' });
  }
}
export const updateCategory = async (req: Request, res: Response) => {
  const { uid, cate_id, cate_name, cate_pic } = req.body;

  if (!uid || !cate_id || !cate_name || !cate_pic) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await pool.execute(
      'UPDATE category SET cate_name = ?, cate_pic = ? WHERE uid = ? AND cate_id = ?',
      [cate_name, cate_pic, uid, cate_id]
    );

    return res.status(200).json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({ message: 'Database error' });
  }
};
