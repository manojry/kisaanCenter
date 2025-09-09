import { Shop } from '../models/shop';
import { ShopEntity } from '../entities/ShopEntity';
import { ShopDTO, CreateShopDTO, UpdateShopDTO } from '../dtos/ShopDTO';
import { toShopDTO, fromCreateShopDTO, fromShopModel } from '../mappers/shopMapper';

import { ShopCreate, ShopUpdate } from '../schemas/shop';

export const createShop = async (data: ShopCreate): Promise<ShopDTO> => {

  const entity = fromCreateShopDTO(data);
  // Ensure required fields are present
  const shopModel = await Shop.create({
    name: entity.name ?? '',
    owner_id: entity.owner_id ?? 0,
    address: entity.address ?? null,
    contact: entity.contact ?? null,
    status: entity.status ?? 'active',
  });
  return toShopDTO(fromShopModel(shopModel));
};

export const getAllShops = async (owner_id?: number): Promise<ShopDTO[]> => {
  const where: any = {};
  if (owner_id !== undefined) where.owner_id = owner_id;
  const shops = await Shop.findAll({ where });
  return shops.map(model => toShopDTO(fromShopModel(model)));
};

export const getShopById = async (id: number): Promise<ShopDTO | null> => {
  const shop = await Shop.findByPk(id);
  if (!shop) return null;
  return toShopDTO(fromShopModel(shop));
};

export const updateShop = async (id: number, data: ShopUpdate): Promise<ShopDTO | null> => {
  const shop = await Shop.findByPk(id);
  if (!shop) return null;
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

export const deleteShop = async (id: number): Promise<boolean> => {
  const shop = await Shop.findByPk(id);
  if (!shop) return false;
  await shop.destroy();
  return true;
};
