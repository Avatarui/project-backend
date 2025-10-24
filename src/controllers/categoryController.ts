import { Request, Response } from "express";
import { CategoryService } from "../services/categoryService";
import { AuthRequest } from "../middlewares/auth";

// Member
export const getCategory = async (req: Request, res: Response) => {
  try {
    const uid =
      (req.query.uid as string) ||
      (req.body.uid as string) ||
      (req as any)?.user?.uid;

    if (!uid) return res.status(400).json({ message: "Missing uid" });

    const categories = await CategoryService.getMemberCategories(uid);
    return res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching category:", error);
    return res.status(500).json({ message: "Database error" });
  }
};

// Admin
export const addCategory = async (req: Request, res: Response) => {
  try {
    const uid =
      (req.body.uid as string) ||
      (req.query.uid as string) ||
      (req as any)?.user?.uid;

    const { cate_name, cate_pic } = req.body;
    if (!uid || !cate_name || !cate_pic) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await CategoryService.addDefaultCategory(uid, cate_name, cate_pic);

    if (result.duplicate) {
      return res.status(400).json({
        message: `ไม่สามารถเพิ่มหมวดหมู่ "${cate_name}" ได้ เนื่องจากมีอยู่แล้ว`,
      });
    }

    return res.status(200).json({ message: "Category created successfully" });
  } catch (error) {
    console.error("Error inserting category:", error);
    return res.status(500).json({ message: "Database error" });
  }
};

export const getDefaultCategories = async (req: Request, res: Response) => {
  try {
    const uid =
      (req.query.uid as string) ||
      (req.body.uid as string) ||
      (req as any)?.user?.uid;

    if (!uid) return res.status(400).json({ message: "Missing uid" });

    const categories = await CategoryService.getDefaultCategories(uid);
    return res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching default categories:", error);
    return res.status(500).json({ message: "Database error" });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const uid =
      (req.body.uid as string) ||
      (req.query.uid as string) ||
      (req as any)?.user?.uid;

    const { cate_id, cate_name, cate_pic } = req.body;
    if (!uid || !cate_id || !cate_name || !cate_pic) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await CategoryService.updateDefaultCategory(uid, Number(cate_id), cate_name, cate_pic);
    return res.status(200).json({ message: "Category updated successfully" });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({ message: "Database error" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const uid =
      (req.body.uid as string) ||
      (req.query.uid as string) ||
      (req as any)?.user?.uid;

    const { cate_id } = req.body;
    if (!uid || !cate_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ เรียก checkCategoryUsage ก่อนลบ
    const usage = await CategoryService.checkCategoryUsage(uid, Number(cate_id));
    if (usage.inUse) {
      return res.status(400).json({
        code: "CATEGORY_IN_USE",
        message: `ไม่สามารถลบหมวดหมู่ได้ เนื่องจากยังมีกิจกรรมในหมวดนี้อยู่ (${usage.activity_count} activity, ${usage.activity_detail_count} activity_detail)`,
        details: usage,
      });
    }

    // ✅ ถ้าไม่ถูกใช้งาน → ลบได้
    const result: any = await CategoryService.deleteDefaultCategory(uid, Number(cate_id));

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({ message: "Database error" });
  }
};