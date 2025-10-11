// User service for business logic related to users
import { USER_ROLES } from '../shared/constants/index';

import { User } from '../models/user';
import { UserDTO } from '../dtos';
import { toUserDTO, fromUserModel } from '../mappers/userMapper';
import { 
  UserCreate, 
  UserUpdate, 
  UserPasswordReset, 
  UserSearch,
  UserRole 
} from '../schemas/user';

// Import shared utilities and constants
import { PasswordManager } from '../shared/utils/auth';
import { 
  ValidationError, 
  NotFoundError, 
  AuthenticationError
} from '../shared/utils/errors';

/**
 * Generates username following multi-tenancy convention using shared utilities
 */

/**
 * Validates role creation permissions using shared constants
 */
function validateRoleCreation(
  requestingUserRole: UserRole,
  targetRole: UserRole
): boolean {
  if (requestingUserRole === USER_ROLES.SUPERADMIN) {
    return (targetRole === USER_ROLES.SUPERADMIN || targetRole === USER_ROLES.OWNER);
  }
  if (requestingUserRole === USER_ROLES.OWNER) {
    return (targetRole === USER_ROLES.FARMER || targetRole === USER_ROLES.BUYER);
  }
  return false;
}



export const createUser = async (
  data: UserCreate,
  requestingUserId?: number,
  requestingUserRole?: UserRole
): Promise<UserDTO> => {
  // Validate input data
  if (!data.role) {
    throw new ValidationError('Role is required');
  }

  // Validate role creation permissions
  if (requestingUserRole && !validateRoleCreation(requestingUserRole, data.role)) {
    throw new AuthenticationError(`${requestingUserRole} cannot create ${data.role} users`);
  }

  const userData = { ...data };
  userData.balance = typeof userData.balance === 'number' ? userData.balance : 0;

  // For owner and superadmin, shop_id should be null
  if (userData.role === USER_ROLES.OWNER || userData.role === USER_ROLES.SUPERADMIN) {
    userData.shop_id = null;
  }

  // Auto-generate username if not provided
  if (!userData.username) {
    // Use part of name (firstname or name), shop_id, and a unique number
    let baseName = '';
      baseName = 'user';
  const shopIdPart = userData.shop_id ? userData.shop_id.toString() : '0';
    let uniqueNum = 1;
    let candidate = `${baseName}_${shopIdPart}_${uniqueNum}`;
    // Find a unique username
    // eslint-disable-next-line no-await-in-loop
    while (await User.findOne({ where: { username: candidate } })) {
      uniqueNum++;
      candidate = `${baseName}_${shopIdPart}_${uniqueNum}`;
    }
    userData.username = candidate;
  } else {
    // If username is provided, ensure uniqueness
    const existingUser = await User.findOne({ where: { username: userData.username } });
    if (existingUser) {
      // Use structured conflict error so controller error handler can map to 409
      const { ConflictError } = await import('../shared/utils/errors');
      throw new ConflictError('Username already exists', { code: 'USER_ALREADY_EXISTS', field: 'username' });
    }
  }

  // Get requesting user's owner_id for farmer/buyer creation
  if ((data.role === USER_ROLES.FARMER || data.role === USER_ROLES.BUYER) && requestingUserId) {
    const requestingUser = await User.findByPk(requestingUserId);
    if (requestingUser && requestingUser.role === USER_ROLES.OWNER) {
      userData.shop_id = requestingUser.shop_id;
    }
  }

  // Validate shop exists for farmer/buyer
  if ((data.role === USER_ROLES.FARMER || data.role === USER_ROLES.BUYER) && userData.shop_id) {
    const { Shop } = await import('../models/shop');
    const shop = await Shop.findByPk(userData.shop_id);
    if (!shop) {
      throw new ValidationError('Invalid shop_id: Shop does not exist');
    }
  }

  // status removed from simplified model
  userData.created_by = requestingUserId || null;

  // Hash password using PasswordManager
  if (userData.password) {
    const passwordManager = new PasswordManager();
    userData.password = await passwordManager.hashPassword(userData.password);
  }
    const userModel = await User.create(userData as import('../models/user').UserCreationAttributes);
  const entity = fromUserModel(userModel);
  return await toUserDTO(entity);
};

export const getAllUsers = async (
  searchParams: UserSearch,
  requestingUser: { id: number; role: UserRole; owner_id?: string | null },
  // includeBalance: boolean = false // Removed unused parameter
): Promise<{ users: UserDTO[]; total: number; page: number; limit: number }> => {
  const where: Record<string, unknown> = {};
  const includeShop: Array<Record<string, unknown>> = [];
  
  // Role-based filtering using shared constants with optimized JOINs
  if (requestingUser.role === USER_ROLES.OWNER) {
    // Owner sees only their farmers and buyers (by shop) - use JOIN instead of N+1
    const { Shop } = await import('../models/shop');
    includeShop.push({
      model: Shop,
      as: 'userShop',
      where: { owner_id: requestingUser.id },
      required: true,
      attributes: ['id', 'name', 'owner_id']
    });
  } else if (requestingUser.role === USER_ROLES.FARMER || requestingUser.role === USER_ROLES.BUYER) {
    // Users can only see themselves
    where.id = requestingUser.id;
  } else {
    // Superadmin sees all users - include shop info with LEFT JOIN
    const { Shop } = await import('../models/shop');
    includeShop.push({
      model: Shop,
      as: 'userShop',
      required: false,
      attributes: ['id', 'name', 'owner_id']
    });
  }
  
  if (searchParams.role) where.role = searchParams.role;
  if (searchParams.shop_id) where.shop_id = searchParams.shop_id;
  
  const offset = (searchParams.page - 1) * searchParams.limit;
  const { count, rows } = await User.findAndCountAll({
    where,
    include: includeShop,
    limit: searchParams.limit,
    offset,
    order: [['created_at', 'DESC']],
    attributes: { exclude: ['password'] },
    distinct: true // Important for accurate count with JOINs
  });
  
  const users = await Promise.all(rows.map(async (model) => await toUserDTO(fromUserModel(model as User))));
  return { users, total: count, page: searchParams.page, limit: searchParams.limit };
};

export const getUserById = async (
  id: number,
  requestingUser: { id: number; role: UserRole; owner_id?: string | null }
): Promise<UserDTO | null> => {
  const { Shop } = await import('../models/shop');
  
  // Single query with JOIN instead of separate queries
  const user = await User.findByPk(id, { 
    attributes: { exclude: ['password'] },
    include: [{
      model: Shop,
      as: 'userShop',
      attributes: ['id', 'name', 'owner_id'],
      required: false
    }]
  });
  if (!user) return null;
  
  // Permission check using shared constants - now with shop data already loaded
  if (requestingUser.role === USER_ROLES.SUPERADMIN) {
    // Can view anyone
  } else if (requestingUser.role === USER_ROLES.OWNER) {
    // Can view their farmers/buyers (by shop) or themselves
    if (user.id !== requestingUser.id) {
      if (!user.shop_id) throw new AuthenticationError('Access denied');
      // No additional query needed - shop is already loaded
  const shop = (user as { userShop?: { owner_id?: string | null } }).userShop;
  if (!shop || shop.owner_id !== String(requestingUser.id)) {
        throw new AuthenticationError('Access denied');
      }
    }
  } else {
    // Users can only view themselves
    if (user.id !== requestingUser.id) {
      throw new AuthenticationError('Access denied');
    }
  }
  
  return await toUserDTO(fromUserModel(user));
};

export const updateUser = async (
  id: number,
  data: UserUpdate,
  requestingUser: { id: number; role: UserRole; owner_id?: string | null }
): Promise<UserDTO | null> => {
  const user = await User.findByPk(id);
  if (!user) throw new NotFoundError('User not found');
  
  // Permission check based on role hierarchy using shared constants
  if (requestingUser.role === USER_ROLES.SUPERADMIN) {
    // Can update anyone
  } else if (requestingUser.role === USER_ROLES.OWNER) {
    // Can update their farmers/buyers (by shop) or themselves
    if (user.id !== requestingUser.id) {
      if (!user.shop_id) throw new AuthenticationError('Access denied');
      const shop = await (await import('../models/shop')).Shop.findByPk(user.shop_id);
      if (!shop || shop.owner_id !== requestingUser.id) {
        throw new AuthenticationError('Access denied');
      }
    }
  } else {
    // Users can only update themselves
    if (user.id !== requestingUser.id) {
      throw new AuthenticationError('Access denied');
    }
  }
  
  // Hash password if provided using PasswordManager
  if (data.password) {
    const passwordManager = new PasswordManager();
    data.password = await passwordManager.hashPassword(data.password);
  }
  
  await user.update(data);
  const updated = await User.findByPk(id, { attributes: { exclude: ['password'] } });
  if (!updated) return null;
  return toUserDTO(fromUserModel(updated));
};

export const resetPassword = async (
  userId: number,
  passwordData: UserPasswordReset
): Promise<void> => {
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError('User not found');
  
  const passwordManager = new PasswordManager();
  const isValid = await passwordManager.verifyPassword(passwordData.current_password, user.password);
  if (!isValid) throw new ValidationError('Current password is incorrect');
  
  const hashedPassword = await passwordManager.hashPassword(passwordData.new_password);
  await user.update({ password: hashedPassword });
};

export const adminResetPassword = async (
  userId: number,
  newPassword: string,
  requestingUser: { id: number; role: UserRole }
): Promise<void> => {
  if (requestingUser.role !== USER_ROLES.SUPERADMIN && requestingUser.role !== USER_ROLES.OWNER) {
    throw new AuthenticationError('Access denied');
  }
  
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError('User not found');
  
  const passwordManager = new PasswordManager();
  const hashedPassword = await passwordManager.hashPassword(newPassword);
  await user.update({ password: hashedPassword });
};

export const deleteUser = async (
  id: number,
  requestingUser: { id: number; role: UserRole; owner_id?: string | null }
): Promise<boolean> => {
  const user = await User.findByPk(id);
  if (!user) throw new NotFoundError('User not found');
  
  if (requestingUser.id === id) {
    throw new ValidationError('Cannot delete your own account');
  }
  
  // Permission check using shared constants
  if (requestingUser.role === USER_ROLES.SUPERADMIN) {
    // Can delete anyone except themselves
  } else if (requestingUser.role === USER_ROLES.OWNER) {
    // Can delete their farmers/buyers only (by shop)
    if (!user.shop_id) throw new AuthenticationError('Access denied');
    const shop = await (await import('../models/shop')).Shop.findByPk(user.shop_id);
    if (!shop || shop.owner_id !== requestingUser.id) {
      throw new AuthenticationError('Access denied');
    }
  } else {
    throw new AuthenticationError('Access denied');
  }
  
  await user.destroy();
  return true;
};
