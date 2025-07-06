import { Request, Response } from 'express';
import { Activity } from '../types/activity';
import pool from '../config/database';
export const createActivity = async (req: Request, res: Response) => {
    const { uid, cate_id, act_name, act_pic } = req.body;

    if (!uid || !cate_id || !act_name || !act_pic) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // 🔍 ตรวจสอบว่า cate_id มีอยู่จริงในตาราง category ก่อน
        const [categoryRows] = await pool.execute(
            'SELECT cate_id FROM category WHERE cate_id = ?',
            [cate_id]
        );

        if ((categoryRows as any[]).length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // ✅ ถ้ามี category จริง → ค่อย insert activity
        await pool.execute(
            'INSERT INTO activity (uid, cate_id, act_name, act_pic) VALUES (?, ?, ?, ?)',
            [uid, cate_id, act_name, act_pic]
        );

        return res.status(200).json({ message: 'Activity created successfully' });
    } catch (error) {
        console.error('Error inserting activity:', error);
        return res.status(500).json({ message: 'Database error' });
    }
};

export const getActivity = async (req: Request, res: Response) => {
    const { uid } = req.body;
    if (!uid) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    try {
        const [rows] = await pool.execute('SELECT * FROM activity WHERE uid = ?', [uid]);
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching activity:', error);
        return res.status(500).json({ message: 'Database error' });
    }
}