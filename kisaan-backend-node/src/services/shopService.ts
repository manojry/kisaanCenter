import { Shop } from '../models/shop';
import { ShopEntity } from '../entities/ShopEntity';
import { ShopDTO, CreateShopDTO, UpdateShopDTO } from '../dtos/ShopDTO';
import { toShopDTO, fromCreateShopDTO, fromShopModel } from '../mappers/shopMapper';
import { ShopCreate, ShopUpdate } from '../schemas/shop';

export const createShop = async (data: ShopCreate): Promise<ShopDTO> => {
  const entity = fromCreateShopDTO(data);
  const shopModel = await Shop.create(entity);
  return toShopDTO(fromShopModel(shopModel));
};

export const getAllShops = async (owner_id?: string): Promise<ShopDTO[]> => {
  const where: any = {};
  if (owner_id) where.owner_id = owner_id;
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
  await shop.update(data);
  return toShopDTO(fromShopModel(shop));
};

export const deleteShop = async (id: number): Promise<boolean> => {
  const shop = await Shop.findByPk(id);
  if (!shop) return false;
  await shop.destroy();
  return true;
};
