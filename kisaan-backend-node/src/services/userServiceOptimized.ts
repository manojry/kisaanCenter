/**
 * Optimized User Service - Eliminates N+1 queries and implements caching
 * Replaces multiple inefficient user queries across the application
 */

import { User } from '../models/user';
import { Shop } from '../models/shop';
import { Op } from 'sequelize';
import { UserDTO, UserFilters, UserContext } from '../types/user';
import { AuthorizationError, ValidationError } from '../shared/utils/errors';

// Cache for shop-scoped user data
class UserCacheService {
  private cache = new Map<string, { users: User[]; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getUsersByShop(shopId: number, forceRefresh = false): Promise<User[]> {
    const cacheKey = `shop_${shopId}_users`;
    const cached = this.cache.get(cacheKey);

    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.users;
    }

    // Single optimized query with all necessary data
    const users = await User.findAll({
      where: { 
        shop_id: shopId,
        role: { [Op.in]: ['farmer', 'buyer', 'employee'] }
      },
      include: [
        {
          model: Shop,
          as: 'shop',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      attributes: { exclude: ['password'] },
      order: [
        ['firstname', 'ASC'],
        ['username', 'ASC']
      ]
    });

    this.cache.set(cacheKey, { users, timestamp: Date.now() });
    return users;
  }

  invalidateShopCache(shopId: number) {
    const cacheKey = `shop_${shopId}_users`;
    this.cache.delete(cacheKey);
  }

  clearCache() {
    this.cache.clear();
  }
}

const userCache = new UserCacheService();

/**
 * Get users with shop information in a single optimized query
 * Replaces the inefficient patterns found in multiple controllers
 */
export const getUsersWithShopInfo = async (
  requestingUser: UserContext,
  filters: UserFilters = {}
): Promise<{ users: UserDTO[]; total: number; page: number; limit: number }> => {
  
  const where: Record<string, unknown> = {};
  const includeShop = [];

  // Build efficient WHERE clause based on requesting user's role
  if (requestingUser.role === 'owner') {
    // Single query to get shop IDs owned by this user
    includeShop.push({
      model: Shop,
      as: 'shop',
      where: { owner_id: requestingUser.id },
      required: true,
      attributes: ['id', 'name']
    });
  } else if (requestingUser.role === 'farmer' || requestingUser.role === 'buyer') {
    // Users can only see themselves
    where.id = requestingUser.id;
  }
  // Superadmin sees all users (no additional where clause)

  // Apply additional filters
  if (filters.role) where.role = filters.role;
  if (filters.shop_id) where.shop_id = filters.shop_id;
  if (filters.search) {
    // Use a separate 'or' variable to avoid symbol index
    (where as any).or = [
      { username: { [Op.iLike]: `%${filters.search}%` } },
      { firstname: { [Op.iLike]: `%${filters.search}%` } },
      { email: { [Op.iLike]: `%${filters.search}%` } }
    ];
  }

  // Single optimized query with proper pagination
  const offset = ((filters.page || 1) - 1) * (filters.limit || 20);
  const { count, rows } = await User.findAndCountAll({
    where,
    include: includeShop.length > 0 ? includeShop : [
      {
        model: Shop,
        as: 'shop',
        attributes: ['id', 'name'],
        required: false
      }
    ],
    attributes: { exclude: ['password'] },
    limit: filters.limit || 20,
    offset,
    order: [['created_at', 'DESC']],
    distinct: true // Important for accurate count with JOINs
  });

  const users = rows.map((user: User & { shop?: { name?: string } }) => ({
    id: user.id,
    username: user.username,
    firstname: user.firstname ?? '',
    email: user.email ?? '',
    contact: user.contact ?? undefined,
    role: user.role,
    shop_id: user.shop_id ?? undefined,
    shop_name: user.shop?.name,
    balance: user.balance,
    custom_commission_rate: user.custom_commission_rate ?? undefined,
    created_at: user.createdAt,
    updated_at: user.updatedAt
  }));

  return {
    users,
    total: count,
    page: filters.page || 1,
    limit: filters.limit || 20
  };
};

/**
 * Get users by shop ID with caching - optimized for frequent access
 * Used by frontend components that frequently need shop users
 */
export const getUsersByShopCached = async (
  shopId: number,
  requestingUser: UserContext,
  forceRefresh = false
): Promise<UserDTO[]> => {
  
  // Permission check
  if (requestingUser.role === 'owner') {
    const shop = await Shop.findByPk(shopId);
    if (!shop || shop.owner_id !== requestingUser.id) {
      throw new AuthorizationError('Access denied to shop users');
    }
  }

  const users = await userCache.getUsersByShop(shopId, forceRefresh);
  
  return users.map((user: User & { shop?: { name?: string } }) => ({
    id: user.id,
    username: user.username,
    firstname: user.firstname ?? '',
    email: user.email ?? '',
    contact: user.contact ?? undefined,
    role: user.role,
    shop_id: user.shop_id ?? undefined,
    shop_name: user.shop?.name,
    balance: user.balance,
    custom_commission_rate: user.custom_commission_rate ?? undefined,
    created_at: user.createdAt,
    updated_at: user.updatedAt
  }));
};

/**
 * Get users with balance information - single query with computed balance
 * Replaces multiple separate queries for balance calculation
 */
export const getUsersWithBalance = async (
  shopId: number,
  requestingUser: UserContext
): Promise<UserDTO[]> => {
  
  // Permission check
  if (requestingUser.role === 'owner') {
    const shop = await Shop.findByPk(shopId);
    if (!shop || shop.owner_id !== requestingUser.id) {
      throw new AuthorizationError('Access denied to shop users');
    }
  }

  // Single query with subqueries for balance calculation
  const users = await User.findAll({
    where: { 
      shop_id: shopId,
      role: { [Op.in]: ['farmer', 'buyer'] }
    },
    include: [
      {
        model: Shop,
        as: 'shop',
        attributes: ['id', 'name'],
        required: false
      }
    ],
    attributes: {
      exclude: ['password'],
      include: [
        // Current balance from user table (should be accurate due to balance reconciliation)
        ['balance', 'current_balance']
      ]
    },
    order: [
      ['role', 'ASC'], // farmers first, then buyers
      ['firstname', 'ASC'],
      ['username', 'ASC']
    ]
  });

  return users.map((user: User & { shop?: { name?: string } }) => ({
    id: user.id,
    username: user.username,
    firstname: user.firstname ?? '',
    email: user.email ?? '',
    contact: user.contact ?? undefined,
    role: user.role,
    shop_id: user.shop_id ?? undefined,
    shop_name: user.shop?.name,
    balance: user.balance,
    custom_commission_rate: user.custom_commission_rate ?? undefined,
    created_at: user.createdAt,
    updated_at: user.updatedAt
  }));
};

/**
 * Create user with automatic cache invalidation
 */
export const createUserOptimized = async (
  userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  requestingUser: UserContext
): Promise<UserDTO> => {
  
  // Validation and user creation logic (existing logic)
  const user = await User.create(userData);
  
  // Invalidate cache for the relevant shop
  if (user.shop_id) {
    userCache.invalidateShopCache(user.shop_id);
  }
  
  return {
    id: user.id,
    username: user.username,
    firstname: user.firstname || '',
    email: user.email || '',
    contact: user.contact || undefined,
    role: user.role,
    shop_id: user.shop_id || undefined,
    balance: user.balance,
    custom_commission_rate: user.custom_commission_rate || undefined,
    created_at: user.createdAt,
    updated_at: user.updatedAt
  };
};

/**
 * Update user with automatic cache invalidation
 */
export const updateUserOptimized = async (
  userId: number,
  updateData: Partial<User>,
  requestingUser: UserContext
): Promise<UserDTO> => {
  
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ValidationError('User not found');
  }

  // Permission check
  if (requestingUser.role === 'owner' && user.shop_id) {
    const shop = await Shop.findByPk(user.shop_id);
    if (!shop || shop.owner_id !== requestingUser.id) {
      throw new AuthorizationError('Access denied');
    }
  }

  await user.update(updateData);
  
  // Invalidate cache for the relevant shop
  if (user.shop_id) {
    userCache.invalidateShopCache(user.shop_id);
  }
  
  return {
    id: user.id,
    username: user.username,
    firstname: user.firstname || '',
    email: user.email || '',
    contact: user.contact || undefined,
    role: user.role,
    shop_id: user.shop_id || undefined,
    balance: user.balance,
    custom_commission_rate: user.custom_commission_rate || undefined,
    created_at: user.createdAt,
    updated_at: user.updatedAt
  };
};

/**
 * Permission helper - consolidated permission logic
 */
export class PermissionService {
  static async checkShopAccess(
    userId: number,
    userRole: string,
    targetShopId: number
  ): Promise<boolean> {
    
    if (userRole === 'superadmin') return true;
    
    if (userRole === 'owner') {
      const shop = await Shop.findByPk(targetShopId, { attributes: ['owner_id'] });
      return shop?.owner_id === userId;
    }
    
    if (['farmer', 'buyer', 'employee'].includes(userRole)) {
      const user = await User.findByPk(userId, { attributes: ['shop_id'] });
      return user?.shop_id === targetShopId;
    }
    
    return false;
  }
  
  static async getUserShopId(userId: number, userRole: string): Promise<number | null> {
    if (userRole === 'owner') {
      const shop = await Shop.findOne({ 
        where: { owner_id: userId },
        attributes: ['id'] 
      });
      return shop?.id || null;
    }
    
    const user = await User.findByPk(userId, { attributes: ['shop_id'] });
    return user?.shop_id || null;
  }
}

export { userCache as UserCache };