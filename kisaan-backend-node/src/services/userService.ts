// User service for business logic related to users

import { User } from '../models/user';
import { UserCreate, UserUpdate } from '../schemas/user';

function generateUsername(firstname: string, ownerId: string) {
  return `${firstname.toLowerCase()}_${ownerId}`;
}

export const createUser = async (data: UserCreate & { firstname?: string }) => {
  let userData = { ...data };
  if ((data.role === 'farmer' || data.role === 'buyer') && data.firstname && data.owner_id) {
    userData.username = generateUsername(data.firstname, data.owner_id);
  }
  return User.create(userData);
};

export const getAllUsers = async () => {
  return User.findAll();
};

export const getUserById = async (id: number) => {
  return User.findByPk(id);
};

export const updateUser = async (id: number, data: UserUpdate) => {
  const user = await User.findByPk(id);
  if (!user) return null;
  return user.update(data);
};

export const deleteUser = async (id: number) => {
  const user = await User.findByPk(id);
  if (!user) return null;
  await user.destroy();
  return true;
};
