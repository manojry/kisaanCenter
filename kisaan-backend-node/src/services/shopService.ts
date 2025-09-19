import { Shop } from '../models/shop';
import { ShopEntity } from '../entities/ShopEntity';
import { ShopDTO, CreateShopDTO, UpdateShopDTO } from '../dtos/ShopDTO';
import { toShopDTO, fromCreateShopDTO, fromShopModel } from '../mappers/shopMapper';
import { ShopCreate, ShopUpdate } from '../schemas/shop';
import { UserRole } from '../schemas/user';

export const getShopsForSuperadmin = async (): Promise<ShopDTO[]> => {
  const shops = await Shop.findAll({
    include: [{
      model: require('../models/user').User,
      as: 'owner',
      attributes: ['id', 'username', 'email']
    }]
  });
  return shops.map(model => toShopDTO(fromShopModel(model)));
};

export const getAvailableOwners = async (): Promise<any[]> => {
  const { User } = require('../models/user');
  const owners = await User.findAll({
    where: {
      role: 'owner',
      shop_id: null // Only owners without shops
    },
    attributes: ['id', 'username', 'email']
  });
  return owners;
};

export const createShop = async (data: ShopCreate): Promise<ShopDTO> => {
  // Validate owner exists and doesn't already have a shop
  const { User } = require('../models/user');
  const owner = await User.findByPk(data.owner_id);
  if (!owner) {
    throw { status: 400, message: 'Owner not found' };
  }
  if (owner.role !== 'owner') {
    throw { status: 400, message: 'User must be an owner to create a shop' };
  }
  
  // Check if owner already has a shop
  const existingShop = await Shop.findOne({ where: { owner_id: data.owner_id } });
  if (existingShop) {
    throw { status: 400, message: 'Owner already has a shop' };
  }

  const entity = fromCreateShopDTO(data);
  const shopModel = await Shop.create({
    name: entity.name ?? '',
    owner_id: entity.owner_id ?? 0,
    address: entity.address ?? null,
    contact: entity.contact ?? null,
    status: entity.status ?? 'active',
  });
  
  // Update owner's shop_id
  await owner.update({ shop_id: shopModel.id });
  
  return toShopDTO(fromShopModel(shopModel));
};

export const getAllShops = async (
  owner_id?: number,
  requestingUser?: { role: UserRole; id: number }
): Promise<ShopDTO[]> => {
  const where: any = {};
  // Only allow owners to see their own shop(s)
  if (requestingUser?.role === 'owner') {
    where.owner_id = requestingUser.id;
  } else if (owner_id !== undefined) {
    where.owner_id = owner_id;
  }
  // Superadmin gets all shops (no filter)
  const shops = await Shop.findAll({ where });
  return shops.map(model => toShopDTO(fromShopModel(model)));
};

export const getShopById = async (
  id: number,
  requestingUser?: { role: UserRole; id: number }
): Promise<ShopDTO | null> => {
  const shop = await Shop.findByPk(id);
  if (!shop) return null;
  
  // Permission check
  if (requestingUser?.role === 'owner' && shop.owner_id !== requestingUser.id) {
    throw { status: 403, message: 'Access denied' };
  }
  
  return toShopDTO(fromShopModel(shop));
};

export const updateShop = async (
  id: number, 
  data: ShopUpdate,
  requestingUser?: { role: UserRole; id: number }
): Promise<ShopDTO | null> => {
  const shop = await Shop.findByPk(id);
  if (!shop) return null;
  
  // Permission check
  if (requestingUser?.role === 'owner' && shop.owner_id !== requestingUser.id) {
    throw { status: 403, message: 'Access denied' };
  }
  
  const updateData = {
    ...data,
    address: data.address ?? null,
    contact: data.contact ?? null,
  };
  if (updateData.owner_id !== undefined) {
    updateData.owner_id = Number(updateData.owner_id);
  }
  await shop.update(updateData);
  return toShopDTO(fromShopModel(shop));
};

export const deleteShop = async (
  id: number,
  requestingUser?: { role: UserRole; id: number }
): Promise<boolean> => {
  const shop = await Shop.findByPk(id);
  if (!shop) return false;
  
  // Permission check
  if (requestingUser?.role === 'owner' && shop.owner_id !== requestingUser.id) {
    throw { status: 403, message: 'Access denied' };
  }
  
  // Update owner's shop_id to null
  const { User } = require('../models/user');
  await User.update({ shop_id: null }, { where: { id: shop.owner_id } });
  
  await shop.destroy();
  return true;
};
