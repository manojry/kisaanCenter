// Unassign a single category from a shop
export const unassignCategoryFromShop = async (req: Request, res: Response) => {
  try {
    // Accept both DELETE with body and DELETE with query params
    const shop_id = req.body.shop_id || req.query.shop_id;
    const category_id = req.body.category_id || req.query.category_id;
    const parsedShopId = parseInt(shop_id, 10);
    const parsedCategoryId = parseInt(category_id, 10);
    if (isNaN(parsedShopId) || isNaN(parsedCategoryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop_id or category_id',
      });
    }
    const deletedCount = await shopCategoryService.removeCategoriesFromShop({
      shop_id: parsedShopId,
      category_ids: [parsedCategoryId],
    });
    if (deletedCount > 0) {
      return res.status(200).json({
        success: true,
        message: 'Category unassigned from shop successfully',
        removed_count: deletedCount,
        shop_id: parsedShopId,
        category_id: parsedCategoryId,
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found',
      });
    }
  } catch (error: any) {
    console.error('Error unassigning category from shop:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unassign category from shop',
      message: error.message,
    });
  }
};
import { Request, Response } from 'express';
import * as shopCategoryService from '../services/shopCategoryService';
import { 
  AssignCategoriesToShopSchema, 
  RemoveCategoriesFromShopSchema 
} from '../schemas/shopCategory';
import { z } from 'zod';

export const assignCategoriesToShop = async (req: Request, res: Response) => {
  try {
    console.log('Shop category assignment request:', req.body);
    const validatedData = AssignCategoriesToShopSchema.parse(req.body);
    const assignments = await shopCategoryService.assignCategoriesToShop(validatedData);
    res.status(201).json({
      success: true,
      message: 'Categories assigned to shop successfully',
      data: assignments,
      count: assignments.length,
    });
  } catch (error: any) {
    console.error('Error assigning categories to shop:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues,
      });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Assignment already exists',
      });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid foreign key reference',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to assign categories to shop',
      message: error.message,
    });
  }
};

export const removeCategoriesFromShop = async (req: Request, res: Response) => {
  try {
    const validatedData = RemoveCategoriesFromShopSchema.parse(req.body);
    
    const removedCount = await shopCategoryService.removeCategoriesFromShop(validatedData);
    
    res.status(200).json({
      success: true,
      message: 'Categories removed from shop successfully',
      removed_count: removedCount,
    });
  } catch (error: any) {
    console.error('Error removing categories from shop:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues,
      });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid foreign key reference',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to remove categories from shop',
      message: error.message,
    });
  }
};

export const getShopCategories = async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const parsedShopId = parseInt(shopId, 10);
    
    if (isNaN(parsedShopId)) {
      return res.status(400).json({
        error: 'Invalid shop ID',
      });
    }
    
    const categories = await shopCategoryService.getShopCategories(parsedShopId);
    
    res.status(200).json({
      success: true,
      message: 'Shop categories retrieved successfully',
      data: categories,
      count: categories.length,
      shop_id: parsedShopId,
    });
  } catch (error: any) {
    console.error('Error getting shop categories:', error);
    res.status(500).json({
      error: 'Failed to retrieve shop categories',
      message: error.message,
    });
  }
};

export const getCategoryShops = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const parsedCategoryId = parseInt(categoryId, 10);
    
    if (isNaN(parsedCategoryId)) {
      return res.status(400).json({
        error: 'Invalid category ID',
      });
    }
    
    const shops = await shopCategoryService.getCategoryShops(parsedCategoryId);
    
    res.status(200).json({
      success: true,
      message: 'Category shops retrieved successfully',
      data: shops,
      count: shops.length,
      category_id: parsedCategoryId,
    });
  } catch (error: any) {
    console.error('Error getting category shops:', error);
    res.status(500).json({
      error: 'Failed to retrieve category shops',
      message: error.message,
    });
  }
};

export const checkShopCategoryAssignment = async (req: Request, res: Response) => {
  try {
    const { shopId, categoryId } = req.params;
    const parsedShopId = parseInt(shopId, 10);
    const parsedCategoryId = parseInt(categoryId, 10);
    
    if (isNaN(parsedShopId) || isNaN(parsedCategoryId)) {
      return res.status(400).json({
        error: 'Invalid shop ID or category ID',
      });
    }
    
    const isAssigned = await shopCategoryService.isShopCategoryAssigned(parsedShopId, parsedCategoryId);
    
    res.status(200).json({
      success: true,
      message: 'Assignment check completed',
      is_assigned: isAssigned,
      shop_id: parsedShopId,
      category_id: parsedCategoryId,
    });
  } catch (error: any) {
    console.error('Error checking shop category assignment:', error);
    res.status(500).json({
      error: 'Failed to check assignment',
      message: error.message,
    });
  }
};

export const getShopCategoryAssignments = async (req: Request, res: Response) => {
  try {
    const { shop_id, category_id } = req.query;
    
    let parsedShopId: number | undefined;
    let parsedCategoryId: number | undefined;
    
    if (shop_id) {
      parsedShopId = parseInt(shop_id as string, 10);
      if (isNaN(parsedShopId)) {
        return res.status(400).json({
          error: 'Invalid shop ID',
        });
      }
    }
    
    if (category_id) {
      parsedCategoryId = parseInt(category_id as string, 10);
      if (isNaN(parsedCategoryId)) {
        return res.status(400).json({
          error: 'Invalid category ID',
        });
      }
    }
    
    const assignments = await shopCategoryService.getShopCategoryAssignments(parsedShopId, parsedCategoryId);
    
    res.status(200).json({
      success: true,
      message: 'Shop category assignments retrieved successfully',
      data: assignments,
      count: assignments.length,
      filters: {
        shop_id: parsedShopId,
        category_id: parsedCategoryId,
      },
    });
  } catch (error: any) {
    console.error('Error getting shop category assignments:', error);
    res.status(500).json({
      error: 'Failed to retrieve assignments',
      message: error.message,
    });
  }
};

export const removeAllCategoriesFromShop = async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const parsedShopId = parseInt(shopId, 10);
    
    if (isNaN(parsedShopId)) {
      return res.status(400).json({
        error: 'Invalid shop ID',
      });
    }
    
    const removedCount = await shopCategoryService.removeAllCategoriesFromShop(parsedShopId);
    
    res.status(200).json({
      success: true,
      message: 'All categories removed from shop successfully',
      removed_count: removedCount,
      shop_id: parsedShopId,
    });
  } catch (error: any) {
    console.error('Error removing all categories from shop:', error);
    res.status(500).json({
      error: 'Failed to remove all categories from shop',
      message: error.message,
    });
  }
};
