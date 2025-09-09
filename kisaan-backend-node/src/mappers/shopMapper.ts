// Functions to map between ShopEntity, ShopDTO, and ORM model
import { ShopEntity } from '../entities/ShopEntity';
import { ShopDTO, CreateShopDTO, UpdateShopDTO } from '../dtos/ShopDTO';
import { Shop } from '../models/shop';

export function toShopDTO(entity: ShopEntity): ShopDTO {
  return {
    id: entity.id!,
    name: entity.name!,
    owner_id: Number(entity.owner_id!),
    address: entity.address,
    contact: entity.contact,
    status: entity.status!,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
  };
}

export function fromCreateShopDTO(dto: CreateShopDTO): ShopEntity {
  return new ShopEntity({
    name: dto.name,
    owner_id: dto.owner_id,
    address: dto.address,
    contact: dto.contact,
    status: 'active',
  });
}

export function fromShopModel(model: Shop): ShopEntity {
  return new ShopEntity(model.get({ plain: true }));
}
