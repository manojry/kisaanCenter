import { Op } from 'sequelize';
import { BaseRepository } from './BaseRepository';
import { Plan } from '../models/plan';
import { PlanEntity } from '../entities/PlanEntity';
import { PlanCreateDTO, PlanUpdateDTO } from '../dtos';
// Simplified repository after plan model flattening

export class PlanRepository extends BaseRepository<Plan, PlanEntity> {
  protected model = Plan;
  protected entityName = 'Plan';

  protected toDomainEntity(model: Plan): PlanEntity {
    return new PlanEntity({
      id: model.id,
      name: model.name,
      description: model.description,
      features: model.features,
      created_at: model.createdAt,
      updated_at: model.updatedAt
    } as any);
  }

  protected toModelData(entity: PlanEntity): any {
    return {
      name: entity.name,
      description: entity.description,
      features: Array.isArray((entity as any).features) ? JSON.stringify((entity as any).features) : (entity as any).features
    };
  }
  // findActive / findByStatus removed (no status field in simplified model)

  async searchByName(searchTerm: string): Promise<PlanEntity[]> {
    const models = await this.model.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { description: { [Op.iLike]: `%${searchTerm}%` } }
        ]
      },
      order: [['name', 'ASC']]
    });
    return models.map(model => this.toDomainEntity(model));
  }

  // findByPriceRange removed (pricing fields removed)
}