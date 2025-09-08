// Authentication and authorization middleware
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user';
import { UserRole } from '../schemas/user';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Extend Express Request type to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: UserRole;
    owner_id?: string | null;
    shop_id?: number | null;
  };
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { 
      id: number; 
      username: string; 
      role: UserRole; 
      owner_id?: string | null;
      shop_id?: number | null;
    };
    // Fetch fresh user data to ensure user still exists and is active
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user || user.status !== 'active') {
      req.user = undefined;
      res.status(401).json({ error: 'Invalid or inactive user' });
      return;
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role as UserRole,
      owner_id: user.owner_id,
      shop_id: user.shop_id,
    };

    next();
  } catch (error) {
  req.user = undefined;
  res.status(403).json({ error: 'Invalid token' });
  }
};

/**
 * Middleware to check if user has required role(s)
 * @param allowedRoles - Array of roles that can access the resource
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Access denied',
        message: `Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}` 
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user can access resource within their tenant
 * @param getOwnerId - Function to extract owner_id from request params
 */
export const requireTenantAccess = (getOwnerId?: (req: Request) => string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Superadmin can access everything
    if (req.user.role === 'superadmin') {
      next();
      return;
    }

    // If owner_id is provided in params, check if user has access to that tenant
    const requestedOwnerId = getOwnerId ? getOwnerId(req) : req.params.owner_id;
    
    if (requestedOwnerId) {
      // Owners can only access their own tenant
      if (req.user.role === 'owner' && req.user.owner_id !== requestedOwnerId) {
        res.status(403).json({ error: 'Access denied to this tenant' });
        return;
      }
      
      // Farmers/buyers can only access their own tenant
      if ((req.user.role === 'farmer' || req.user.role === 'buyer') && 
          req.user.owner_id !== requestedOwnerId) {
        res.status(403).json({ error: 'Access denied to this tenant' });
        return;
      }
    }

    next();
  };
};

/**
 * Middleware to check if user can access their own resource or has admin privileges
 * @param getUserId - Function to extract user_id from request params
 */
export const requireSelfOrAdmin = (getUserId?: (req: Request) => number) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const requestedUserId = getUserId ? getUserId(req) : parseInt(req.params.id || req.params.userId);
    
    // Superadmin and owners can access any user
    if (req.user.role === 'superadmin' || req.user.role === 'owner') {
      next();
      return;
    }

    // Users can only access their own data
    if (req.user.id !== requestedUserId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    next();
  };
};

/**
 * Optional authentication middleware - continues even if no valid token
 */
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || 'supersecret';
      const decoded = jwt.verify(token, secret) as { 
        id: number; 
        username: string; 
        role: UserRole; 
        owner_id?: string | null;
        shop_id?: number | null;
      };
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        owner_id: decoded.owner_id,
        shop_id: decoded.shop_id,
      };
    } catch (error) {
      // Token is invalid, but we continue without user
      req.user = undefined;
    }
  }
  
  next();
};
