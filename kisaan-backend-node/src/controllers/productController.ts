import { Request, Response } from 'express';
import { sequelize } from '../models/index';

// Create a new product
export const createProduct = async (req: Request, res: Response) => {
  try {
    console.log('📝 Product creation request:', req.body);
    const { name, category_id, description, price, unit, record_status } = req.body;
    
    // Validation
    if (!name || !category_id) {
      console.log('❌ Missing required fields:', { name, category_id });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['name', 'category_id']
      });
    }

    console.log('🔍 Checking if category exists:', category_id);
    // Check if category exists
    const [categoryCheck] = await sequelize.query(
      'SELECT id FROM kisaan_categories WHERE id = :category_id',
      { replacements: { category_id } }
    );
    console.log('📊 Category check result:', categoryCheck);

    if (!categoryCheck || (Array.isArray(categoryCheck) && categoryCheck.length === 0)) {
      console.log('❌ Category not found:', category_id);
      return res.status(400).json({
        success: false,
        error: 'Invalid category_id',
        message: 'Category does not exist'
      });
    }
    
    console.log('💾 Creating product with data:', {
      name, 
      category_id,
      description: description || null,
      price: price || null,
      unit: unit || null,
      record_status: record_status || 'active'
    });
    
    const [results] = await sequelize.query(
      `INSERT INTO kisaan_products (name, category_id, description, price, unit, record_status, created_at, updated_at)
       VALUES (:name, :category_id, :description, :price, :unit, :record_status, NOW(), NOW())
       RETURNING *`,
      { 
        replacements: { 
          name, 
          category_id,
          description: description || null,
          price: price || null,
          unit: unit || null,
          record_status: record_status || 'active'
        } 
      }
    );
    
    console.log('✅ Product created successfully:', results);
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: Array.isArray(results) ? results[0] : results,
    });
  } catch (error: any) {
    console.error('❌ Error creating product:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Handle unique constraint violation
    if (error.message && error.message.includes('duplicate key')) {
      return res.status(409).json({
        success: false,
        error: 'Product already exists',
        message: 'A product with this name and category already exists'
      });
    }
    
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
    console.log('📋 Fetching all products...');
    let query = `
      SELECT p.*, c.name as category_name 
      FROM kisaan_products p 
      LEFT JOIN kisaan_categories c ON p.category_id = c.id 
      WHERE p.record_status = 'active'
      ORDER BY p.created_at DESC
    `;
    
    const [results] = await sequelize.query(query);
    console.log('📊 Products fetched:', Array.isArray(results) ? results.length : 0);
    
    res.json({
      success: true,
      data: Array.isArray(results) ? results : [],
      count: Array.isArray(results) ? results.length : 0,
    });
  } catch (error: any) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({
      success: false,
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
      `SELECT p.*, c.name as category_name 
       FROM kisaan_products p 
       LEFT JOIN kisaan_categories c ON p.category_id = c.id 
       WHERE p.id = :id AND p.record_status = 'active'`,
      { replacements: { id } }
    );
    
    if (!results || (Array.isArray(results) && results.length === 0)) {
      return res.status(404).json({
        success: false,
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
      success: false,
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
