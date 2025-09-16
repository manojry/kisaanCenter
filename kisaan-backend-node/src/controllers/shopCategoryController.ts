import { Request, Response } from 'express';
import sequelize from '../config/database';

// Get categories assigned to a shop
class ShopCategoryController {
  async getShopCategories(req: Request, res: Response) {
  try {
    const shopId = req.params.id;
    
    const [results] = await sequelize.query(
      `SELECT c.*, sc.is_active as assigned_active
       FROM kisaan_categories c
       INNER JOIN kisaan_shop_categories sc ON c.id = sc.category_id
       WHERE sc.shop_id = :shopId AND sc.is_active = true
       ORDER BY c.name`,
      { replacements: { shopId } }
    );
    
    res.json({ categories: Array.isArray(results) ? results : [] });
  } catch (error: any) {
    console.error('Error fetching shop categories:', error);
    res.status(500).json({ error: 'Failed to fetch shop categories', message: error.message });
  }
};

// Assign a category to a shop
  async assignCategoryToShop(req: Request, res: Response) {
  try {
    const { shopId, categoryId } = req.params;
    const shop_id = Number(shopId);
    const category_id = Number(categoryId);
    
    const [mapping] = await sequelize.query(
      `INSERT INTO kisaan_shop_categories (shop_id, category_id, is_active, created_at, updated_at)
       VALUES (:shop_id, :category_id, true, NOW(), NOW())
       ON CONFLICT (shop_id, category_id) 
       DO UPDATE SET is_active = true, updated_at = NOW()
       RETURNING *`,
      { replacements: { shop_id, category_id } }
    );
    
    res.status(201).json({ message: 'Category assigned to shop', mapping });
  } catch (error: any) {
    console.error('Error assigning category to shop:', error);
    res.status(500).json({ error: 'Failed to assign category', message: error.message });
  }
};

// Remove a category from a shop
  async removeCategoryFromShop(req: Request, res: Response) {
  try {
    const { shopId, categoryId } = req.params;
    const shop_id = Number(shopId);
    const category_id = Number(categoryId);
    
    await sequelize.query(
      `UPDATE kisaan_shop_categories 
       SET is_active = false, updated_at = NOW()
       WHERE shop_id = :shop_id AND category_id = :category_id`,
      { replacements: { shop_id, category_id } }
    );
    
    res.json({ message: 'Category removed from shop' });
  } catch (error: any) {
    console.error('Error removing category from shop:', error);
    res.status(500).json({ error: 'Failed to remove category', message: error.message });
  }
  }
}

const shopCategoryController = new ShopCategoryController();
export { shopCategoryController };
export const getShopCategories = shopCategoryController.getShopCategories.bind(shopCategoryController);