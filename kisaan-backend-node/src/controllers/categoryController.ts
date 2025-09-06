import { Request, Response } from 'express';
import * as categoryService from '../services/categoryService';
import { CategoryCreateSchema, CategoryUpdateSchema } from '../schemas/category';
import { z } from 'zod';

export const createCategory = async (req: Request, res: Response) => {
  try {
    const validatedData = CategoryCreateSchema.parse(req.body);
    
    const category = await categoryService.createCategory(validatedData);
    
    res.status(201).json({
      message: 'Category created successfully',
      data: category,
    });
  } catch (error: any) {
    console.error('Error creating category:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues,
      });
    }
    
    res.status(500).json({
      error: 'Failed to create category',
      message: error.message,
    });
  }
};

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const { active_only } = req.query;
    const activeOnly = active_only === 'true';
    
    const categories = await categoryService.getAllCategories(activeOnly);
    
    res.status(200).json({
      message: 'Categories retrieved successfully',
      data: categories,
      count: categories.length,
    });
  } catch (error: any) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      error: 'Failed to retrieve categories',
      message: error.message,
    });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id, 10);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({
        error: 'Invalid category ID',
      });
    }
    
    const category = await categoryService.getCategoryById(categoryId);
    
    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
      });
    }
    
    res.status(200).json({
      message: 'Category retrieved successfully',
      data: category,
    });
  } catch (error: any) {
    console.error('Error getting category:', error);
    res.status(500).json({
      error: 'Failed to retrieve category',
      message: error.message,
    });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id, 10);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({
        error: 'Invalid category ID',
      });
    }
    
    const validatedData = CategoryUpdateSchema.parse(req.body);
    
    const category = await categoryService.updateCategory(categoryId, validatedData);
    
    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
      });
    }
    
    res.status(200).json({
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error: any) {
    console.error('Error updating category:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues,
      });
    }
    
    res.status(500).json({
      error: 'Failed to update category',
      message: error.message,
    });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id, 10);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({
        error: 'Invalid category ID',
      });
    }
    
    const deleted = await categoryService.deleteCategory(categoryId);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Category not found',
      });
    }
    
    res.status(200).json({
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      error: 'Failed to delete category',
      message: error.message,
    });
  }
};

export const deactivateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id, 10);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({
        error: 'Invalid category ID',
      });
    }
    
    const category = await categoryService.deactivateCategory(categoryId);
    
    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
      });
    }
    
    res.status(200).json({
      message: 'Category deactivated successfully',
      data: category,
    });
  } catch (error: any) {
    console.error('Error deactivating category:', error);
    res.status(500).json({
      error: 'Failed to deactivate category',
      message: error.message,
    });
  }
};

export const getActiveCategories = async (req: Request, res: Response) => {
  try {
    const categories = await categoryService.getActiveCategories();
    
    res.status(200).json({
      message: 'Active categories retrieved successfully',
      data: categories,
      count: categories.length,
    });
  } catch (error: any) {
    console.error('Error getting active categories:', error);
    res.status(500).json({
      error: 'Failed to retrieve active categories',
      message: error.message,
    });
  }
};

export const searchCategories = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Search query is required',
      });
    }
    
    const categories = await categoryService.searchCategories(q);
    
    res.status(200).json({
      message: 'Categories search completed',
      data: categories,
      count: categories.length,
      query: q,
    });
  } catch (error: any) {
    console.error('Error searching categories:', error);
    res.status(500).json({
      error: 'Failed to search categories',
      message: error.message,
    });
  }
};

export const reorderCategories = async (req: Request, res: Response) => {
  try {
    const { categories } = req.body;
    
    if (!Array.isArray(categories)) {
      return res.status(400).json({
        error: 'Categories must be an array',
      });
    }
    
    // Validate each category item
    for (const item of categories) {
      if (!item.id || !item.display_order) {
        return res.status(400).json({
          error: 'Each category must have id and display_order',
        });
      }
    }
    
    const success = await categoryService.reorderCategories(categories);
    
    if (!success) {
      return res.status(500).json({
        error: 'Failed to reorder categories',
      });
    }
    
    res.status(200).json({
      message: 'Categories reordered successfully',
    });
  } catch (error: any) {
    console.error('Error reordering categories:', error);
    res.status(500).json({
      error: 'Failed to reorder categories',
      message: error.message,
    });
  }
};
