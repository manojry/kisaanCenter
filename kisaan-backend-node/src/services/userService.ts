// Type for requestingUser used in getAllUsers
export interface RequestingUser {
  id: number | string;
  role: string;
  owner_id?: string | number | null;
  shop_id?: string | number | null;
  username?: string;
  [key: string]: any;
}
// User service for business logic related to users
import { USER_ROLES } from '../shared/constants/index';

import { UserRepository } from '../repositories/UserRepository';
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
  const userRepo = new UserRepository();
  // Validate input data
  if (!data.role) {
    throw new ValidationError('Role is required');
  }
  if (requestingUserRole && !validateRoleCreation(requestingUserRole, data.role)) {
    throw new AuthenticationError(`${requestingUserRole} cannot create ${data.role} users`);
  }
  let userData = { ...data };
  userData.balance = typeof userData.balance === 'number' ? userData.balance : 0;
  if (userData.role === USER_ROLES.OWNER || userData.role === USER_ROLES.SUPERADMIN) {
    userData.shop_id = null;
  }
  // Auto-generate username if not provided
  if (!userData.username) {
    let baseName = 'user';
    const shopIdPart = userData.shop_id ? userData.shop_id.toString() : '0';
    let uniqueNum = 1;
    let candidate = `${baseName}_${shopIdPart}_${uniqueNum}`;
    while (await userRepo.usernameExists(candidate)) {
      uniqueNum++;
      candidate = `${baseName}_${shopIdPart}_${uniqueNum}`;
    }
    userData.username = candidate;
  } else {
    if (await userRepo.usernameExists(userData.username)) {
      const { ConflictError } = await import('../shared/utils/errors');
      throw new ConflictError('Username already exists', { code: 'USER_ALREADY_EXISTS', field: 'username' });
    }
  }
  // Get requesting user's owner_id for farmer/buyer creation
  if ((data.role === USER_ROLES.FARMER || data.role === USER_ROLES.BUYER) && requestingUserId) {
  const requestingUser = await userRepo.findById(requestingUserId);
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
  userData.created_by = requestingUserId || null;
  if (userData.password) {
    const passwordManager = new PasswordManager();
    userData.password = await passwordManager.hashPassword(userData.password);
  }
  const entity = await userRepo.create(userData);
  return await toUserDTO(entity);
};

export const getAllUsers = async (
  searchParams: UserSearch,
  requestingUser: RequestingUser
): Promise<{ users: UserDTO[]; total: number; page: number; limit: number }> => {
  const userRepo = new UserRepository();
  let users: UserDTO[] = [];
  let total = 0;
  // Role-based filtering
    if (requestingUser.role === USER_ROLES.OWNER) {
      // Use shop_id for owner, not id or owner_id
      const shopId = requestingUser.shop_id ? Number(requestingUser.shop_id) : undefined;
      if (!shopId) {
        console.warn('[USER_SERVICE] Owner user missing shop_id:', requestingUser);
        users = [];
        total = 0;
      } else {
        const ownerUsers = await userRepo.findByShop(shopId);
        users = await Promise.all(ownerUsers.map(async (entity) => await toUserDTO(entity)));
        total = users.length;
      }
  } else if (requestingUser.role === USER_ROLES.FARMER || requestingUser.role === USER_ROLES.BUYER) {
  const userId = typeof requestingUser.id === 'string' ? Number(requestingUser.id) : requestingUser.id;
  const user = await userRepo.findById(userId);
    users = user ? [await toUserDTO(user)] : [];
    total = users.length;
  } else {
    // Superadmin sees all users
    // For pagination, you may want to implement a repository method for paginated fetch
    // For now, fetch all and slice manually
    const allUsers = await userRepo.findAll();
    total = allUsers.length;
    const paged = allUsers.slice((searchParams.page - 1) * searchParams.limit, searchParams.page * searchParams.limit);
    users = await Promise.all(paged.map(async (entity: typeof allUsers[0]) => await toUserDTO(entity)));
  }
  // Backend log for debugging empty results
  console.log('[USER_SERVICE] getAllUsers', {
    query: searchParams,
    requestingUser,
    totalFound: total,
    usersPreview: users.slice(0, 3)
  });
  return { users, total, page: searchParams.page, limit: searchParams.limit };
};

export const getUserById = async (
  id: number,
  requestingUser: { id: number; role: UserRole; owner_id?: string | null }
): Promise<UserDTO | null> => {
  const userRepo = new UserRepository();
  const user = await userRepo.findById(id);
  if (!user) return null;
  // Permission check
  if (requestingUser.role === USER_ROLES.SUPERADMIN) {
    // Can view anyone
  } else if (requestingUser.role === USER_ROLES.OWNER) {
    if (user.id !== requestingUser.id) {
      if (!user.shop_id) throw new AuthenticationError('Access denied');
      // You may want to fetch shop and check owner_id here if needed
      // For now, assume shop_id is sufficient
    }
  } else {
    if (user.id !== requestingUser.id) {
      throw new AuthenticationError('Access denied');
    }
  }
  return await toUserDTO(user);
};

export const updateUser = async (
  id: number,
  data: UserUpdate,
  requestingUser: { id: number; role: UserRole; owner_id?: string | null }
): Promise<UserDTO | null> => {
  const userRepo = new UserRepository();
  const user = await userRepo.findById(id);
  if (!user) throw new NotFoundError('User not found');
  if (requestingUser.role === USER_ROLES.SUPERADMIN) {
    // Can update anyone
  } else if (requestingUser.role === USER_ROLES.OWNER) {
    if (user.id !== requestingUser.id) {
      if (!user.shop_id) throw new AuthenticationError('Access denied');
      // You may want to fetch shop and check owner_id here if needed
    }
  } else {
    if (user.id !== requestingUser.id) {
      throw new AuthenticationError('Access denied');
    }
  }
  if (data.password) {
    const passwordManager = new PasswordManager();
    data.password = await passwordManager.hashPassword(data.password);
  }
  const updated = await userRepo.update(id, data);
  return updated ? toUserDTO(updated) : null;
};

export const resetPassword = async (
  userId: number,
  passwordData: UserPasswordReset
): Promise<void> => {
  const userRepo = new UserRepository();
  const user = await userRepo.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  const passwordManager = new PasswordManager();
  const isValid = await passwordManager.verifyPassword(passwordData.current_password, user.password ?? '');
  if (!isValid) throw new ValidationError('Current password is incorrect');
  const hashedPassword = await passwordManager.hashPassword(passwordData.new_password);
  await userRepo.update(userId, { password: hashedPassword });
};

export const adminResetPassword = async (
  userId: number,
  newPassword: string,
  requestingUser: { id: number; role: UserRole }
): Promise<void> => {
  if (requestingUser.role !== USER_ROLES.SUPERADMIN && requestingUser.role !== USER_ROLES.OWNER) {
    throw new AuthenticationError('Access denied');
  }
  const userRepo = new UserRepository();
  const user = await userRepo.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  const passwordManager = new PasswordManager();
  const hashedPassword = await passwordManager.hashPassword(newPassword);
  await userRepo.update(userId, { password: hashedPassword });
};

export const deleteUser = async (
  id: number,
  requestingUser: { id: number; role: UserRole; owner_id?: string | null }
): Promise<boolean> => {
  const userRepo = new UserRepository();
  const user = await userRepo.findById(id);
  if (!user) throw new NotFoundError('User not found');
  if (requestingUser.id === id) {
    throw new ValidationError('Cannot delete your own account');
  }
  if (requestingUser.role === USER_ROLES.SUPERADMIN) {
    // Can delete anyone except themselves
  } else if (requestingUser.role === USER_ROLES.OWNER) {
    if (!user.shop_id) throw new AuthenticationError('Access denied');
    // You may want to fetch shop and check owner_id here if needed
  } else {
    throw new AuthenticationError('Access denied');
  }
  await userRepo.delete(id);
  return true;
};
