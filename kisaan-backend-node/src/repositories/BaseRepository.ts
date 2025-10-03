// src/repositories/BaseRepository.ts
// Generic base repository for CRUD operations
import { Model, FindOptions, Transaction } from 'sequelize';

export abstract class BaseRepository<TModel extends Model, TEntity> {
  protected abstract model: { findByPk: Function; findAll: Function; create: Function; update: Function; destroy: Function };
  protected abstract entityName: string;

  protected abstract toDomainEntity(model: TModel): TEntity;
  protected abstract toModelData(entity: TEntity): Record<string, unknown>;

  async findById(id: number): Promise<TEntity | null> {
    const result = await this.model.findByPk(id);
    return result ? this.toDomainEntity(result) : null;
  }

  async findAll(options?: FindOptions): Promise<TEntity[]> {
    const results = await this.model.findAll(options);
    return results.map((model: TModel) => this.toDomainEntity(model));
  }

  async create(entity: TEntity, options?: { tx?: any }): Promise<TEntity> {
  const data = this.toModelData(entity);
  const createOpts: { transaction?: Transaction } = {};
  if (options?.tx) createOpts.transaction = options.tx;
  const result = await this.model.create(data, createOpts);
  return this.toDomainEntity(result);
  }

  async update(id: number, entity: TEntity, options?: { tx?: any }): Promise<TEntity | null> {
    const data = this.toModelData(entity);
    const updateOpts: { where: { id: number }; returning: boolean; transaction?: Transaction } = { where: { id }, returning: true };
    if (options?.tx) updateOpts.transaction = options.tx;
    const [count, rows] = await this.model.update(data, updateOpts);
    if (count > 0 && rows[0]) {
      return this.toDomainEntity(rows[0]);
    }
    return null;
  }

  async delete(id: number): Promise<boolean> {
    const count = await this.model.destroy({ where: { id } });
    return count > 0;
  }
}
