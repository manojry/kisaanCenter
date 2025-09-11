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
    
    // First try to get products from the mapping table
    let results: any[] = [];
    try {
      const [mappingResults] = await sequelize.query(
        `SELECT p.* FROM kisaan_products p
         INNER JOIN kisaan_shop_products sp ON p.id = sp.product_id
         WHERE sp.shop_id = :shopId AND sp.is_active = true`,
        { replacements: { shopId } }
      );
      results = Array.isArray(mappingResults) ? mappingResults : [];
    } catch (mappingError) {
      console.log('Error querying mapping table:', mappingError);
    }
    
  // Products are only assigned to shops via kisaan_shop_products mapping table. No fallback to shop_id.
    
    res.json({ products: results });
  } catch (error: any) {
    console.error('Error fetching shop products:', error);
    res.status(500).json({ error: 'Failed to fetch shop products', message: error.message });
  }
};
