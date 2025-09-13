import { Request, Response } from 'express';
import { Product } from '../models/product';
import { ShopProducts } from '../models/shopProducts';
import sequelize from '../config/database';
// Assign a product to a shop
export const assignProductToShop = async (req: Request, res: Response) => {
  try {
    const { shopId, productId } = req.params;
    const shop_id = Number(shopId);
    const product_id = Number(productId);
    if (!shopId || isNaN(shop_id)) {
      return res.status(400).json({ error: 'Invalid or missing shopId' });
    }
    if (!productId || isNaN(product_id)) {
      return res.status(400).json({ error: 'Invalid or missing productId' });
    }
    const [mapping, created] = await ShopProducts.findOrCreate({
      where: { shop_id, product_id },
      defaults: { shop_id, product_id, is_active: true },
    });
    if (!created && !mapping.is_active) {
      mapping.is_active = true;
      await mapping.save();
    }
    res.status(201).json({ message: 'Product assigned to shop', mapping });
  } catch (error: any) {
    console.error('Error assigning product to shop:', error);
    res.status(500).json({ error: 'Failed to assign product', message: error.message });
  }
};

// Remove a product from a shop
export const removeProductFromShop = async (req: Request, res: Response) => {
  try {
    const { shopId, productId } = req.params;
    const shop_id = Number(shopId);
    const product_id = Number(productId);
    if (!shopId || isNaN(shop_id)) {
      return res.status(400).json({ error: 'Invalid or missing shopId' });
    }
    if (!productId || isNaN(product_id)) {
      return res.status(400).json({ error: 'Invalid or missing productId' });
    }
    const mapping = await ShopProducts.findOne({ where: { shop_id, product_id } });
    if (!mapping) {
      return res.status(404).json({ error: 'Mapping not found' });
    }
    await mapping.destroy();
    res.json({ message: 'Product removed from shop' });
  } catch (error: any) {
    console.error('Error removing product from shop:', error);
    res.status(500).json({ error: 'Failed to remove product', message: error.message });
  }
};

// Toggle product active status for a shop
export const toggleProductActiveStatus = async (req: Request, res: Response) => {
  try {
    const { shopId, productId } = req.params;
    const shop_id = Number(shopId);
    const product_id = Number(productId);
    if (!shopId || isNaN(shop_id)) {
      return res.status(400).json({ error: 'Invalid or missing shopId' });
    }
    if (!productId || isNaN(product_id)) {
      return res.status(400).json({ error: 'Invalid or missing productId' });
    }
    const mapping = await ShopProducts.findOne({ where: { shop_id, product_id } });
    if (!mapping) {
      return res.status(404).json({ error: 'Mapping not found' });
    }
    mapping.is_active = !mapping.is_active;
    await mapping.save();
    res.json({ message: 'Product active status toggled', mapping });
  } catch (error: any) {
    console.error('Error toggling product active status:', error);
    res.status(500).json({ error: 'Failed to toggle status', message: error.message });
  }
};

// Get all products assigned to a shop (via shop_products mapping table)
export const getShopProducts = async (req: Request, res: Response) => {
  try {
    const shopId = req.params.id;
    const shop_id = Number(shopId);
    if (!shopId || isNaN(shop_id)) {
      return res.status(400).json({ error: 'Invalid or missing shopId' });
    }
    const [results] = await sequelize.query(
      `SELECT p.*, c.name as category_name 
       FROM kisaan_products p
       INNER JOIN kisaan_shop_products sp ON p.id = sp.product_id
       LEFT JOIN kisaan_categories c ON p.category_id = c.id
       WHERE sp.shop_id = :shopId AND sp.is_active = true AND p.record_status = 'active'
       ORDER BY p.name`,
      { replacements: { shopId } }
    );
    res.json({ products: Array.isArray(results) ? results : [] });
  } catch (error: any) {
    console.error('Error fetching shop products:', error);
    res.status(500).json({ error: 'Failed to fetch shop products', message: error.message });
  }
};

// Get all available products for a shop (filtered by shop's categories)
export const getAvailableProductsForShop = async (req: Request, res: Response) => {
  try {
    const shopId = req.params.id;
    const shop_id = Number(shopId);
    if (!shopId || isNaN(shop_id)) {
      return res.status(400).json({ error: 'Invalid or missing shopId' });
    }
    // First check if shop has any categories assigned
    const [categoryCheck] = await sequelize.query(
      `SELECT COUNT(*) as category_count
       FROM kisaan_shop_categories sc 
       WHERE sc.shop_id = :shopId AND sc.is_active = true`,
      { replacements: { shopId } }
    );
    const hasCategoriesAssigned = (categoryCheck as any)[0]?.category_count > 0;
    let query: string;
    if (hasCategoriesAssigned) {
      // If shop has categories, filter by those categories
      query = `SELECT p.*, c.name as category_name
               FROM kisaan_products p
               LEFT JOIN kisaan_categories c ON p.category_id = c.id
               WHERE p.category_id IN (
                 SELECT sc.category_id 
                 FROM kisaan_shop_categories sc 
                 WHERE sc.shop_id = :shopId AND sc.is_active = true
               )
               AND p.record_status = 'active'
               AND p.id NOT IN (
                 SELECT sp.product_id 
                 FROM kisaan_shop_products sp 
                 WHERE sp.shop_id = :shopId AND sp.is_active = true
               )
               ORDER BY c.name, p.name`;
    } else {
      // If shop has no categories, show all active products not already assigned
      query = `SELECT p.*, c.name as category_name
               FROM kisaan_products p
               LEFT JOIN kisaan_categories c ON p.category_id = c.id
               WHERE p.record_status = 'active'
               AND p.id NOT IN (
                 SELECT sp.product_id 
                 FROM kisaan_shop_products sp 
                 WHERE sp.shop_id = :shopId AND sp.is_active = true
               )
               ORDER BY c.name, p.name`;
    }
    
    const [results] = await sequelize.query(query, { replacements: { shopId } });
    
    res.json({ 
      products: Array.isArray(results) ? results : [],
      message: hasCategoriesAssigned 
        ? 'Products filtered by shop categories' 
        : 'No categories assigned to shop - showing all available products'
    });
  } catch (error: any) {
    console.error('Error fetching available products for shop:', error);
    res.status(500).json({ error: 'Failed to fetch available products', message: error.message });
  }
};
