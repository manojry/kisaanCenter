// src/mappers/userMapper.ts
// Functions to map between UserEntity, UserDTO, and ORM model

import { UserEntity } from '../entities/UserEntity';
import { UserDTO, CreateUserDTO, UpdateUserDTO } from '../dtos/UserDTO';
import { User } from '../models/user';

export function toUserDTO(entity: UserEntity): UserDTO {
  return {
    id: entity.id!,
    username: entity.username!,
    role: entity.role!,
    owner_id: entity.owner_id,
    shop_id: entity.shop_id,
    contact: entity.contact,
    email: entity.email,
    firstname: entity.firstname ?? null,
    status: entity.status!,
    balance: typeof entity.balance === 'string' ? parseFloat(entity.balance) : entity.balance!, // handle DECIMAL as string
    cumulative_value: typeof entity.cumulative_value === 'string' ? parseFloat(entity.cumulative_value) : (entity.cumulative_value ?? 0),
    created_by: entity.created_by,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
  };
}

export function fromCreateUserDTO(dto: CreateUserDTO): UserEntity {
  return new UserEntity({
    username: dto.username,
    password: dto.password,
    role: dto.role,
    owner_id: dto.owner_id,
    shop_id: dto.shop_id,
    contact: dto.contact,
    email: dto.email,
    status: 'active',
  });
}

export function fromUserModel(model: User): UserEntity {
  const plain = model.get({ plain: true });
  // Ensure cumulative_value is included and parsed as number
  if (plain.cumulative_value === undefined && model.cumulative_value !== undefined) {
    plain.cumulative_value = model.cumulative_value;
  }
  if (plain.cumulative_value !== undefined && typeof plain.cumulative_value === 'string') {
    plain.cumulative_value = parseFloat(plain.cumulative_value);
  }
  if (plain.balance !== undefined && typeof plain.balance === 'string') {
    plain.balance = parseFloat(plain.balance);
  }
  return new UserEntity(plain);
}
