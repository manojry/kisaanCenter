// User service for business logic related to users
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

import { User } from '../models/user';
import { UserEntity } from '../entities/UserEntity';
import { UserDTO, CreateUserDTO, UpdateUserDTO } from '../dtos/UserDTO';
import { toUserDTO, fromCreateUserDTO, fromUserModel } from '../mappers/userMapper';
import { 
  UserCreate, 
  UserUpdate, 
  UserPasswordReset, 
  UserSearch,
  UserRole 
} from '../schemas/user';

/**
 * Generates username following multi-tenancy convention
 */
function generateUsername(firstname: string, ownerId: string): string {
  return `${firstname.toLowerCase()}_${ownerId}`;
}

/**
 * Validates role creation permissions
 */
function validateRoleCreation(
  requestingUserRole: UserRole,
  targetRole: UserRole
): boolean {
  if (requestingUserRole === 'superadmin') {
    return ['superadmin', 'owner'].includes(targetRole);
  }
  if (requestingUserRole === 'owner') {
    return ['farmer', 'buyer'].includes(targetRole);
  }
  return false;
}



export const createUser = async (
  data: UserCreate & { firstname?: string },
  requestingUserId?: number,
  requestingUserRole?: UserRole
): Promise<UserDTO> => {
  // Validate role creation permissions
  if (requestingUserRole && !validateRoleCreation(requestingUserRole, data.role)) {
    throw { status: 403, message: `${requestingUserRole} cannot create ${data.role} users` };
  }

  let userData = { ...data };
  userData.balance = typeof userData.balance === 'number' ? userData.balance : 0;

  // For owner and superadmin, shop_id should be null
  if (userData.role === 'owner' || userData.role === 'superadmin') {
    userData.shop_id = null;
  }

  // Auto-generate username if not provided
  if (!userData.username) {
    // Use part of name (firstname or name), shop_id, and a unique number
    let baseName = '';
    if (userData.firstname) {
      baseName = userData.firstname.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6);
    } else {
      baseName = 'user';
    }
    let shopIdPart = userData.shop_id ? userData.shop_id.toString() : '0';
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
      throw { status: 409, message: 'Username already exists. Please choose a different username.' };
    }
  }

  // Get requesting user's owner_id for farmer/buyer creation
  if ((data.role === 'farmer' || data.role === 'buyer') && requestingUserId) {
    const requestingUser = await User.findByPk(requestingUserId);
    if (requestingUser && requestingUser.role === 'owner') {
      userData.owner_id = requestingUser.id.toString();
      userData.shop_id = requestingUser.shop_id;
    }
  }

  // Validate shop exists for farmer/buyer
  if ((data.role === 'farmer' || data.role === 'buyer') && userData.shop_id) {
    const { sequelize } = require('../models/index');
    const [shopCheck] = await sequelize.query(
      'SELECT id FROM kisaan_shops WHERE id = :shop_id',
      { replacements: { shop_id: userData.shop_id } }
    );

    if (!shopCheck || (Array.isArray(shopCheck) && shopCheck.length === 0)) {
      throw { status: 400, message: 'Invalid shop_id: Shop does not exist' };
    }
  }

  userData.status = data.status || 'active';
  userData.created_by = requestingUserId || null;

  if (userData.password) {
    userData.password = await bcrypt.hash(userData.password, 12);
  }

  // Ensure firstname is persisted
  const finalUserData = { ...userData };
  finalUserData.balance = Number(finalUserData.balance || 0);
  // If firstname is undefined, set to empty string for DB
  if (typeof finalUserData.firstname === 'undefined') {
    finalUserData.firstname = '';
  }
  const userModel = await User.create(finalUserData as import('../models/user').UserCreationAttributes);
  const entity = fromUserModel(userModel);
  return toUserDTO(entity);
};

export const getAllUsers = async (
  searchParams: UserSearch,
  requestingUser: { id: number; role: UserRole; owner_id?: string | null },
  includeBalance: boolean = false
): Promise<{ users: UserDTO[]; total: number; page: number; limit: number }> => {
  const where: any = {};
  
  // Role-based filtering
  if (requestingUser.role === 'owner') {
    // Owner sees only their farmers and buyers (by shop)
    const { Shop } = await import('../models/shop');
    const shops = await Shop.findAll({ where: { owner_id: requestingUser.id }, attributes: ['id'] });
    const shopIds = shops.map((s: any) => s.id);
    where.shop_id = shopIds.length > 0 ? shopIds : -1; // -1 to ensure no match if no shops
  } else if (requestingUser.role === 'farmer' || requestingUser.role === 'buyer') {
    // Users can only see themselves
    where.id = requestingUser.id;
  }
  // Superadmin sees all users
  
  if (searchParams.role) where.role = searchParams.role;
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.shop_id) where.shop_id = searchParams.shop_id;
  
  const offset = (searchParams.page - 1) * searchParams.limit;
  const { count, rows } = await User.findAndCountAll({
    where,
    limit: searchParams.limit,
    offset,
    order: [['created_at', 'DESC']],
    attributes: { exclude: ['password'] },
  });
  
  const users = rows.map(model => toUserDTO(fromUserModel(model)));
  return { users, total: count, page: searchParams.page, limit: searchParams.limit };
};

export const getUserById = async (
  id: number,
  requestingUser: { id: number; role: UserRole; owner_id?: string | null }
): Promise<UserDTO | null> => {
  const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
  if (!user) return null;
  
  // Permission check
  if (requestingUser.role === 'superadmin') {
    // Can view anyone
  } else if (requestingUser.role === 'owner') {
    // Can view their farmers/buyers (by shop) or themselves
    if (user.id !== requestingUser.id) {
      if (!user.shop_id) throw { status: 403, message: 'Access denied' };
      const shop = await (await import('../models/shop')).Shop.findByPk(user.shop_id);
      if (!shop || shop.owner_id !== requestingUser.id) {
        throw { status: 403, message: 'Access denied' };
      }
    }
  } else {
    // Users can only view themselves
    if (user.id !== requestingUser.id) {
      throw { status: 403, message: 'Access denied' };
    }
  }
  
  return toUserDTO(fromUserModel(user));
};

export const updateUser = async (
  id: number,
  data: UserUpdate,
  requestingUser: { id: number; role: UserRole; owner_id?: string | null }
): Promise<UserDTO | null> => {
  const user = await User.findByPk(id);
  if (!user) throw { status: 404, message: 'User not found' };
  
  // Permission check based on role hierarchy
  if (requestingUser.role === 'superadmin') {
    // Can update anyone
  } else if (requestingUser.role === 'owner') {
    // Can update their farmers/buyers (by shop) or themselves
    if (user.id !== requestingUser.id) {
      if (!user.shop_id) throw { status: 403, message: 'Access denied' };
      const shop = await (await import('../models/shop')).Shop.findByPk(user.shop_id);
      if (!shop || shop.owner_id !== requestingUser.id) {
        throw { status: 403, message: 'Access denied' };
      }
    }
  } else {
    // Users can only update themselves
    if (user.id !== requestingUser.id) {
      throw { status: 403, message: 'Access denied' };
    }
  }
  
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 12);
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
  if (!user) throw { status: 404, message: 'User not found' };
  const isValid = await bcrypt.compare(passwordData.current_password, user.password);
  if (!isValid) throw { status: 400, message: 'Current password is incorrect' };
  const hashedPassword = await bcrypt.hash(passwordData.new_password, 12);
  await user.update({ password: hashedPassword });
};

export const adminResetPassword = async (
  userId: number,
  newPassword: string,
  requestingUser: { id: number; role: UserRole }
): Promise<void> => {
  if (requestingUser.role !== 'superadmin' && requestingUser.role !== 'owner') {
    throw { status: 403, message: 'Access denied' };
  }
  
  const user = await User.findByPk(userId);
  if (!user) throw { status: 404, message: 'User not found' };
  
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await user.update({ password: hashedPassword });
};

export const deleteUser = async (
  id: number,
  requestingUser: { id: number; role: UserRole; owner_id?: string | null }
): Promise<boolean> => {
  const user = await User.findByPk(id);
  if (!user) throw { status: 404, message: 'User not found' };
  
  if (requestingUser.id === id) {
    throw { status: 400, message: 'Cannot delete your own account' };
  }
  
  // Permission check
  if (requestingUser.role === 'superadmin') {
    // Can delete anyone except themselves
  } else if (requestingUser.role === 'owner') {
    // Can delete their farmers/buyers only (by shop)
    if (!user.shop_id) throw { status: 403, message: 'Access denied' };
    const shop = await (await import('../models/shop')).Shop.findByPk(user.shop_id);
    if (!shop || shop.owner_id !== requestingUser.id) {
      throw { status: 403, message: 'Access denied' };
    }
  } else {
    throw { status: 403, message: 'Access denied' };
  }
  
  await user.destroy();
  return true;
};
