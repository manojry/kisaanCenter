import { Request, Response } from 'express';
import { sequelize } from '../models/index';

// Create a new product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      description, 
      category_id, 
      price, 
      unit = null,
      record_status = 'active' 
    } = req.body;
    
    // Validation
    if (!name || !price || !category_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['name', 'category_id', 'price']
      });
    }
    
    const [results] = await sequelize.query(
      `INSERT INTO kisaan_products (name, description, category_id, price, unit, record_status, created_at, updated_at)
       VALUES (:name, :description, :category_id, :price, :unit, :record_status, NOW(), NOW())
       RETURNING *`,
      { 
        replacements: { 
          name, 
          description, 
          category_id, 
          price, 
          unit, 
          record_status 
        } 
      }
    );
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: Array.isArray(results) ? results[0] : results,
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product',
      message: error.message,
    });
  }
};

// Get all products
export const getProducts = async (req: Request, res: Response) => {
  try {
  let query = 'SELECT * FROM kisaan_products WHERE record_status = \'active\'';
  query += ' ORDER BY created_at DESC';
  const [results] = await sequelize.query(query);
    
    res.json({
      success: true,
      data: Array.isArray(results) ? results : [],
      count: Array.isArray(results) ? results.length : 0,
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      error: 'Failed to fetch products',
      message: error.message,
    });
  }
};

// Get product by ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const [results] = await sequelize.query(
      'SELECT * FROM kisaan_products WHERE id = :id AND record_status = \'active\'',
      { replacements: { id } }
    );
    
    if (!results || (Array.isArray(results) && results.length === 0)) {
      return res.status(404).json({
        error: 'Product not found',
      });
    }
    
    res.json({
      success: true,
      data: Array.isArray(results) ? results[0] : results,
    });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      error: 'Failed to fetch product',
      message: error.message,
    });
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.created_at;
    
    const setClause = Object.keys(updateData)
      .map(key => `${key} = :${key}`)
      .join(', ');
    
    if (!setClause) {
      return res.status(400).json({
        error: 'No valid fields to update',
      });
    }
    
    const [results] = await sequelize.query(
      `UPDATE kisaan_products SET ${setClause}, updated_at = NOW() 
       WHERE id = :id AND record_status = 'active'
       RETURNING *`,
      { replacements: { ...updateData, id } }
    );
    
    if (!results || (Array.isArray(results) && results.length === 0)) {
      return res.status(404).json({
        error: 'Product not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: Array.isArray(results) ? results[0] : results,
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({
      error: 'Failed to update product',
      message: error.message,
    });
  }
};

// Delete product (soft delete)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const [results] = await sequelize.query(
      `UPDATE kisaan_products SET record_status = 'deleted', updated_at = NOW() 
       WHERE id = :id AND record_status = 'active'
       RETURNING *`,
      { replacements: { id } }
    );
    
    if (!results || (Array.isArray(results) && results.length === 0)) {
      return res.status(404).json({
        error: 'Product not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      error: 'Failed to delete product',
      message: error.message,
    });
  }
};
