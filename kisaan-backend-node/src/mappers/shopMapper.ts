// Functions to map between ShopEntity, ShopDTO, and ORM model
import { ShopEntity } from '../entities/ShopEntity';
import { ShopDTO, CreateShopDTO, UpdateShopDTO } from '../dtos';
import { Shop } from '../models/shop';

export function toShopDTO(entity: ShopEntity): ShopDTO {
  return {
    id: entity.id!,
    name: entity.name!,
    owner_id: Number(entity.owner_id!),
    location: entity.location || null,
    address: entity.address,
    contact: entity.contact,
    email: entity.email || null,
    commission_rate: entity.commission_rate ?? 0,
    status: entity.status!,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
  };
}

export function fromCreateShopDTO(dto: CreateShopDTO): ShopEntity {
  return new ShopEntity({
    name: dto.name,
    owner_id: dto.owner_id,
    location: dto.location ?? undefined,
    address: dto.address,
    contact: dto.contact,
    email: (dto as any).email, // backward compatibility if email added in DTO later
    commission_rate: (dto as any).commission_rate ?? 0,
    status: 'active',
  });
}

export function fromShopModel(model: Shop): ShopEntity {
  const plain: any = model.get({ plain: true });
  return new ShopEntity({
    id: plain.id,
    name: plain.name,
    owner_id: plain.owner_id,
    plan_id: plain.plan_id,
    location: plain.location ?? null,
    address: plain.address ?? null,
    contact: plain.contact ?? null,
    email: plain.email ?? null,
    commission_rate: plain.commission_rate != null ? Number(plain.commission_rate) : 0,
    settings: plain.settings ?? null,
    status: plain.status,
    created_at: plain.created_at || plain.createdAt,
    updated_at: plain.updated_at || plain.updatedAt,
  });
}
