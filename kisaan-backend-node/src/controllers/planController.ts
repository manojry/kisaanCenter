import { Request, Response } from 'express';
import * as planService from '../services/planService';
import { PlanCreateSchema, PlanUpdateSchema } from '../schemas/plan';
import { z } from 'zod';

export const createPlan = async (req: Request, res: Response) => {
  try {
    // Accept features as array, store as JSON string
    let input = { ...req.body };
    // If features is a string, parse it to array for validation
    if (typeof input.features === 'string') {
      try {
        input.features = JSON.parse(input.features);
      } catch {
        input.features = [];
      }
    }
    const validatedData = PlanCreateSchema.parse(input);
    // Stringify features if it is an array
    const planData = {
      ...validatedData,
      features: Array.isArray(validatedData.features) ? JSON.stringify(validatedData.features) : validatedData.features,
      max_users: validatedData.max_users === null ? undefined : validatedData.max_users,
      max_products: validatedData.max_products === null ? undefined : validatedData.max_products,
      max_transactions: validatedData.max_transactions === null ? undefined : validatedData.max_transactions
    };
    const plan = await planService.createPlan(planData);
    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: plan,
    });
  } catch (error: any) {
    console.error('Error creating plan:', error);
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
        error: 'Plan name must be unique',
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
      error: 'Failed to create plan',
      message: error.message,
    });
  }
};

export const getAllPlans = async (req: Request, res: Response) => {
  try {
    const { active_only } = req.query;
    const activeOnly = active_only === 'true';
    
    const plans = await planService.getAllPlans(activeOnly);
    
    res.status(200).json({
      success: true,
      message: 'Plans retrieved successfully',
      data: plans,
      count: plans.length,
    });
  } catch (error: any) {
    console.error('Error getting plans:', error);
    res.status(500).json({
      error: 'Failed to retrieve plans',
      message: error.message,
    });
  }
};

export const getPlanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const planId = parseInt(id, 10);
    
    if (isNaN(planId)) {
      return res.status(400).json({
        error: 'Invalid plan ID',
      });
    }
    
    const plan = await planService.getPlanById(planId);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Plan retrieved successfully',
      data: plan,
    });
  } catch (error: any) {
    console.error('Error getting plan:', error);
    res.status(500).json({
      error: 'Failed to retrieve plan',
      message: error.message,
    });
  }
};

export const updatePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const planId = parseInt(id, 10);
    
    if (isNaN(planId)) {
      return res.status(400).json({
        error: 'Invalid plan ID',
      });
    }
    
    // Accept features as array, store as JSON string
    let input = { ...req.body };
    if (typeof input.features === 'string') {
      try {
        input.features = JSON.parse(input.features);
      } catch {
        input.features = [];
      }
    }
    const validatedData = PlanUpdateSchema.parse(input);
    const plan = await planService.updatePlan(planId, validatedData);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      data: plan,
    });
  } catch (error: any) {
    console.error('Error updating plan:', error);

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
        error: 'Plan name must be unique',
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
      error: 'Failed to update plan',
      message: error.message,
    });
  }
};

export const deletePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const planId = parseInt(id, 10);
    
    if (isNaN(planId)) {
      return res.status(400).json({
        error: 'Invalid plan ID',
      });
    }
    
    const deleted = await planService.deletePlan(planId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Plan deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting plan:', error);
    res.status(500).json({
      error: 'Failed to delete plan',
      message: error.message,
    });
  }
};

export const deactivatePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const planId = parseInt(id, 10);
    
    if (isNaN(planId)) {
      return res.status(400).json({
        error: 'Invalid plan ID',
      });
    }
    
    const plan = await planService.deactivatePlan(planId);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Plan deactivated successfully',
      data: plan,
    });
  } catch (error: any) {
    console.error('Error deactivating plan:', error);
    res.status(500).json({
      error: 'Failed to deactivate plan',
      message: error.message,
    });
  }
};

export const getActivePlans = async (req: Request, res: Response) => {
  try {
    const plans = await planService.getActivePlans();
    
    res.status(200).json({
      success: true,
      message: 'Active plans retrieved successfully',
      data: plans,
      count: plans.length,
    });
  } catch (error: any) {
    console.error('Error getting active plans:', error);
    res.status(500).json({
      error: 'Failed to retrieve active plans',
      message: error.message,
    });
  }
};

export const searchPlans = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }
    const plans = await planService.searchPlans(q);
    res.status(200).json({
      success: true,
      message: 'Plans search completed',
      data: plans,
      count: plans.length,
      query: q,
    });
  } catch (error: any) {
    console.error('Error searching plans:', error);
    res.status(500).json({
      error: 'Failed to search plans',
      message: error.message,
    });
  }
};
