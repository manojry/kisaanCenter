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
 * Validates user permissions for operations
 */
function validateUserPermissions(
  requestingUser: { id: number; role: UserRole; owner_id?: string | null },
  targetUserId: number,
  operation: 'read' | 'update' | 'delete'
): boolean {
  if (requestingUser.role === 'superadmin') return true;
  if (requestingUser.id === targetUserId) return true;
  if (requestingUser.role === 'owner') return true;
  return false;
}

export const createUser = async (
  data: UserCreate & { firstname?: string },
  requestingUserId?: number
): Promise<UserDTO> => {
  let userData = { ...data };
  if ((data.role === 'farmer' || data.role === 'buyer') && data.firstname && data.owner_id) {
    userData.username = generateUsername(data.firstname, data.owner_id);
  }
  userData.status = data.status || 'active';
  userData.created_by = requestingUserId || null;
  if (userData.password) {
    userData.password = await bcrypt.hash(userData.password, 12);
  }
  const { firstname, ...finalUserData } = userData;
  const userModel = await User.create(finalUserData);
  const entity = fromUserModel(userModel);
  return toUserDTO(entity);
};

export const getAllUsers = async (
  searchParams: UserSearch,
  requestingUser: { id: number; role: UserRole; owner_id?: string | null },
  includeBalance: boolean = false
): Promise<{ users: UserDTO[]; total: number; page: number; limit: number }> => {
  const where: any = {};
  if (requestingUser.role === 'owner' && requestingUser.owner_id) {
    where.owner_id = requestingUser.owner_id;
  } else if (requestingUser.role === 'farmer' || requestingUser.role === 'buyer') {
    where.id = requestingUser.id;
  }
  if (searchParams.role) where.role = searchParams.role;
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.owner_id) where.owner_id = searchParams.owner_id;
  if (searchParams.shop_id) where.shop_id = searchParams.shop_id;
  const offset = (searchParams.page - 1) * searchParams.limit;
  const { count, rows } = await User.findAndCountAll({
    where,
    limit: searchParams.limit,
    offset,
    order: [['created_at', 'DESC']],
    attributes: includeBalance ? { exclude: ['password'] } : { exclude: ['password', 'balance'] },
  });
  const users = rows.map(model => toUserDTO(fromUserModel(model)));
  return { users, total: count, page: searchParams.page, limit: searchParams.limit };
};

export const getUserById = async (
  id: number,
  requestingUser: { id: number; role: UserRole; owner_id?: string | null }
): Promise<UserDTO | null> => {
  if (!validateUserPermissions(requestingUser, id, 'read')) {
    throw { status: 403, message: 'Access denied' };
  }
  const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
  if (!user) return null;
  return toUserDTO(fromUserModel(user));
};

export const updateUser = async (
  id: number,
  data: UserUpdate,
  requestingUser: { id: number; role: UserRole; owner_id?: string | null }
): Promise<UserDTO | null> => {
  if (!validateUserPermissions(requestingUser, id, 'update')) {
    throw { status: 403, message: 'Access denied' };
  }
  const user = await User.findByPk(id);
  if (!user) throw { status: 404, message: 'User not found' };
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

export const deleteUser = async (
  id: number,
  requestingUser: { id: number; role: UserRole; owner_id?: string | null }
): Promise<boolean> => {
  if (!validateUserPermissions(requestingUser, id, 'delete')) {
    throw { status: 403, message: 'Access denied' };
  }
  const user = await User.findByPk(id);
  if (!user) throw { status: 404, message: 'User not found' };
  if (requestingUser.id === id) {
    throw { status: 400, message: 'Cannot delete your own account' };
  }
  await user.destroy();
  return true;
};
