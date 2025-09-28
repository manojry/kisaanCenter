import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { logger } from '../shared/logging/logger';

/**
 * Common route utilities to eliminate duplication across route files
 */

/**
 * Date utility functions used across multiple routes
 */
export const DateUtils = {
  /**
   * Expand YYYY-MM-DD date string to full day ISO string
   * Used in transaction, settlement, and other date-filtered routes
   */
  expandToFullDay(dateStr: string, isEnd: boolean): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return isEnd
        ? `${dateStr}T23:59:59.999Z`
        : `${dateStr}T00:00:00.000Z`;
    }
    return dateStr;
  },

  /**
   * Get today's date in YYYY-MM-DD format
   */
  getTodayString(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },

  /**
   * Parse date range from query parameters with defaults
   */
  parseDateRange(query: any): { startDate: Date; endDate: Date } {
    let { from_date, to_date, startDate, endDate } = query;
    
    // Support both frontend (from_date/to_date) and backend (startDate/endDate) params
    let filterStart: string = from_date || startDate;
    let filterEnd: string = to_date || endDate;

    // Default to today if no dates provided
    if (!filterStart || !filterEnd) {
      const today = this.getTodayString();
      filterStart = today;
      filterEnd = today;
    }

    return {
      startDate: new Date(this.expandToFullDay(filterStart, false)),
      endDate: new Date(this.expandToFullDay(filterEnd, true))
    };
  }
};

/**
 * Authentication and authorization utilities
 */
export const AuthUtils = {
  /**
   * Get user context filters based on role
   */
  getUserFilters(user: any, overrides: any = {}): any {
    const filters: any = { ...overrides };

    // Apply role-based filtering
    if (user?.role === 'owner' && user?.shop_id && !filters.shopId) {
      filters.shopId = Number(user.shop_id);
    }
    if (user?.role === 'farmer' && !filters.farmerId) {
      filters.farmerId = Number(user.id);
    }
    if (user?.role === 'buyer' && !filters.buyerId) {
      filters.buyerId = Number(user.id);
    }

    return filters;
  },

  /**
   * Validate required context for operations
   */
  validateContext(filters: any, requiredFields: string[]): string | null {
    for (const field of requiredFields) {
      if (!filters[field]) {
        return `Missing required ${field}`;
      }
    }
    return null;
  }
};

/**
 * Response formatting utilities
 */
export const ResponseUtils = {
  /**
   * Standard success response
   */
  success(res: Response, data: any, message?: string, meta?: any): void {
    res.json({
      success: true,
      message,
      data,
      ...meta
    });
  },

  /**
   * Standard error response
   */
  error(res: Response, message: string, statusCode: number = 400, details?: any): void {
    res.status(statusCode).json({
      success: false,
      message,
      error: message,
      details
    });
  },

  /**
   * Validation error response
   */
  validationError(res: Response, errors: any): void {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'Validation failed',
      details: errors
    });
  },

  /**
   * Paginated response
   */
  paginated(res: Response, data: any[], total: number, page: number, limit: number): void {
    res.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  }
};

/**
 * Service layer utilities for consistent service calls
 */
export const ServiceUtils = {
  /**
   * Execute service method with error handling
   */
  async executeService<T>(
    serviceMethod: () => Promise<T>, 
    req: Request, 
    res: Response, 
    next: NextFunction
  ): Promise<T | void> {
    try {
      const result = await serviceMethod();
      return result;
    } catch (error: any) {
  (req as any).log?.error({ err: error }, 'service execution error');
  logger.error({ err: error }, 'service execution error');
      
      if (error.status || error.statusCode) {
        ResponseUtils.error(res, error.message, error.status || error.statusCode);
        return;
      }
      
      next(error);
    }
  },

  /**
   * Dynamic service instantiation
   */
  getService(serviceName: string): any {
    try {
      const ServiceClass = require(`../services/${serviceName}Service`)[`${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service`];
      return new ServiceClass();
    } catch (error: any) {
      logger.error({ err: error, serviceName }, 'failed to instantiate service');
      throw new Error(`Service ${serviceName} not found`);
    }
  }
};

/**
 * Controller pattern utilities
 */
export const ControllerUtils = {
  /**
   * Standard controller method wrapper with error handling
   */
  asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  },

  /**
   * Parameter validation helper
   */
  validateParams(req: Request, requiredParams: string[]): string[] {
    const missing: string[] = [];
    for (const param of requiredParams) {
      if (!req.params[param] && !req.body[param] && !req.query[param]) {
        missing.push(param);
      }
    }
    return missing;
  },

  /**
   * ID parameter parser with validation
   */
  parseId(value: string, paramName: string = 'id'): number {
    const id = parseInt(value);
    if (isNaN(id) || id <= 0) {
      throw new Error(`Invalid ${paramName}: must be a positive integer`);
    }
    return id;
  }
};

/**
 * Route factory for common CRUD operations
 */
export class RouteFactory {
  /**
   * Create standard CRUD routes for a resource
   */
  static createCrudRoutes(resourceName: string, controllerClass: any) {
    const router = require('express').Router();
    const controller = new controllerClass();

    // GET /resource - List all
    router.get('/', ControllerUtils.asyncHandler(
      controller.getAll?.bind(controller) || controller[`get${resourceName}s`]?.bind(controller)
    ));

    // GET /resource/:id - Get by ID
    router.get('/:id', ControllerUtils.asyncHandler(
      controller.getById?.bind(controller) || controller[`get${resourceName}ById`]?.bind(controller)
    ));

    // POST /resource - Create new
    router.post('/', ControllerUtils.asyncHandler(
      controller.create?.bind(controller) || controller[`create${resourceName}`]?.bind(controller)
    ));

    // PUT /resource/:id - Update
    router.put('/:id', ControllerUtils.asyncHandler(
      controller.update?.bind(controller) || controller[`update${resourceName}`]?.bind(controller)
    ));

    // DELETE /resource/:id - Delete
    router.delete('/:id', ControllerUtils.asyncHandler(
      controller.delete?.bind(controller) || controller[`delete${resourceName}`]?.bind(controller)
    ));

    return router;
  }

  /**
   * Create analytics routes for a resource
   */
  static createAnalyticsRoutes(resourceName: string, controllerClass: any) {
    const router = require('express').Router();
    const controller = new controllerClass();

    router.get('/analytics', ControllerUtils.asyncHandler(
      controller.getAnalytics?.bind(controller)
    ));

    router.get('/summary', ControllerUtils.asyncHandler(
      controller.getSummary?.bind(controller)
    ));

    router.get('/dashboard', ControllerUtils.asyncHandler(
      controller.getDashboard?.bind(controller)
    ));

    return router;
  }
}

/**
 * Middleware utilities
 */
export const MiddlewareUtils = {
  /**
   * Role-based access wrapper
   */
  requireRoles(roles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return ResponseUtils.error(res, 'Authentication required', 401);
      }

      if (!roles.includes(req.user.role)) {
        return ResponseUtils.error(res, 'Insufficient permissions', 403);
      }

      next();
    };
  },

  /**
   * Shop ownership validation
   */
  validateShopOwnership() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const shopId = req.params.shop_id || req.body.shop_id || req.query.shop_id;
      
      if (req.user?.role === 'owner' && req.user.shop_id !== parseInt(shopId)) {
        return ResponseUtils.error(res, 'Access denied: shop ownership required', 403);
      }

      next();
    };
  }
};