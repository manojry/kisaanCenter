import { Request, Response, NextFunction } from 'express';
import { USER_ROLES } from '../constants/userRoles';

// Dummy role check helpers (replace with your real logic)
function isOwnerOrEmployee(user: any, shopId: number) {
  return user && user.role && [USER_ROLES.OWNER, USER_ROLES.EMPLOYEE].includes(user.role) && user.shop_id === shopId;
}
function isFarmer(user: any, farmerId: number) {
  return user && user.role === USER_ROLES.FARMER && user.id === farmerId;
}

// Auth middleware (assumes req.user is set by previous auth step)

// Type guard for req.user
function getUser(req: Request) {
  // You may want to refine this if you use a custom user type
  return (req as any).user;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  (req as any).user = user;
  next();
}

// Shop owner/employee guard
export function shopAccessGuard(req: Request, res: Response, next: NextFunction) {
  const user = getUser(req);
  const shopId = req.body.shop_id || req.query.shop_id || req.params.shop_id;
  if (!isOwnerOrEmployee(user, Number(shopId))) {
    return res.status(403).json({ error: 'Forbidden: Only shop owner/employee allowed' });
  }
  next();
}

// Farmer read-only guard (allows owner/employee full access, farmer only GET)
export function farmerReadOnlyGuard(req: Request, res: Response, next: NextFunction) {
  const user = getUser(req);
  const farmerId = req.query.farmer_id || req.body.farmer_id;
  if (user && user.role === USER_ROLES.FARMER) {
    if (req.method !== 'GET') {
      return res.status(403).json({ error: 'Forbidden: Farmers can only view their ledger' });
    }
    if (!isFarmer(user, Number(farmerId))) {
      return res.status(403).json({ error: 'Forbidden: Farmers can only view their own ledger' });
    }
  }
  next();
}
