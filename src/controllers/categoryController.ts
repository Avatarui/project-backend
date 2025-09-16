import { Request, Response } from "express";
import { CategoryService } from "../services/categoryService";

// Member
export const getCategory = async (req: Request, res: Response) => {
  const uid = req.query.uid as string;
  if (!uid) return res.status(400).json({ message: "Missing required fields" });

  try {
    const categories = await CategoryService.getMemberCategories(uid);
    return res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching category:", error);
    return res.status(500).json({ message: "Database error" });
  }
};

// Admin
export const addCategory = async (req: Request, res: Response) => {
  const { uid, cate_name, cate_pic } = req.body;
  if (!uid || !cate_name || !cate_pic) return res.status(400).json({ message: "Missing required fields" });

  try {
    await CategoryService.addDefaultCategory(uid, cate_name, cate_pic);
    return res.status(200).json({ message: "Category created successfully" });
  } catch (error) {
    console.error("Error inserting category:", error);
    return res.status(500).json({ message: "Database error" });
  }
};

export const getDefaultCategories = async (req: Request, res: Response) => {
  const uid = req.query.uid as string;
  if (!uid) return res.status(400).json({ message: "Missing required fields" });

  try {
    const categories = await CategoryService.getDefaultCategories(uid);
    return res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching default categories:", error);
    return res.status(500).json({ message: "Database error" });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  const { uid, cate_id, cate_name, cate_pic } = req.body;
  if (!uid || !cate_id || !cate_name || !cate_pic) return res.status(400).json({ message: "Missing required fields" });

  try {
    await CategoryService.updateDefaultCategory(uid, cate_id, cate_name, cate_pic);
    return res.status(200).json({ message: "Category updated successfully" });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({ message: "Database error" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  const { uid, cate_id } = req.body;
  if (!uid || !cate_id) return res.status(400).json({ message: "Missing required fields" });

  try {
    await CategoryService.deleteDefaultCategory(uid, cate_id);
    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({ message: "Database error" });
  }
};
