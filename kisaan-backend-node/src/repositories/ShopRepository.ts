import { BaseRepository } from './BaseRepository';
import { Shop } from '../models/shop';
import { ShopEntity } from '../entities/ShopEntity';

/**
 * Shop Repository Implementation
 */
export class ShopRepository extends BaseRepository<Shop, ShopEntity> {
  protected model = Shop;
  protected entityName = 'Shop';

  /**
   * Convert database model to domain entity
   */
  protected toDomainEntity(model: Shop): ShopEntity {
    return new ShopEntity({
      id: model.id,
      name: model.name,
      owner_id: model.owner_id,
      plan_id: model.plan_id,
      location: (model as any).location ?? null,
      address: model.address,
      contact: model.contact,
      email: (model as any).email ?? null,
      commission_rate: (model as any).commission_rate ? Number((model as any).commission_rate) : 0,
      settings: (model as any).settings ?? null,
      status: model.status,
    });
  }

  /**
   * Convert domain entity to database model data
   */
  protected toModelData(entity: Partial<ShopEntity>): any {
    return {
      name: entity.name,
      owner_id: entity.owner_id,
      plan_id: entity.plan_id,
      location: entity.location,
      address: entity.address,
      contact: entity.contact,
      email: entity.email,
      commission_rate: entity.commission_rate,
      settings: entity.settings,
      status: entity.status,
    };
  }

  /**
   * Find shops by owner
   */
  async findByOwner(ownerId: number): Promise<ShopEntity[]> {
    const models = await this.model.findAll({
      where: { owner_id: ownerId }
    });

    return models.map((model) => this.toDomainEntity(model));
  }

  /**
   * Find active shops
   */
  async findActive(): Promise<ShopEntity[]> {
    const models = await this.model.findAll({
      where: { status: 'active' }
    });

    return models.map((model) => this.toDomainEntity(model));
  }

  /**
   * Find shops by plan
   */
  async findByPlan(planId: number): Promise<ShopEntity[]> {
    const models = await this.model.findAll({
      where: { plan_id: planId }
    });

    return models.map((model) => this.toDomainEntity(model));
  }
}