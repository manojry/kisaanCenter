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
    status: entity.status!,
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
  return new UserEntity(model.get({ plain: true }));
}
