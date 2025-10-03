// src/repositories/BaseRepository.ts
// Generic base repository for CRUD operations
import { Model, ModelStatic, FindOptions, Transaction } from 'sequelize';

export abstract class BaseRepository<TModel extends Model, TEntity> {
  protected abstract model: ModelStatic<TModel>;
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

  async create(entity: TEntity, options?: { tx?: unknown }): Promise<TEntity> {
    const data = this.toModelData(entity);
    const createOpts: { transaction?: Transaction } = {};
    if (options?.tx) createOpts.transaction = options.tx as Transaction;
    // Cast to any because model.create has model-specific creation attribute types
    const result = await this.model.create(data as any, createOpts);
    return this.toDomainEntity(result);
  }

  async update(id: number, entity: TEntity, options?: { tx?: unknown }): Promise<TEntity | null> {
    const data = this.toModelData(entity);
    const updateOpts: { where: { id: number }; returning: boolean; transaction?: Transaction } = { where: { id }, returning: true };
    if (options?.tx) updateOpts.transaction = options.tx as Transaction;
  // Cast data to any to satisfy model-specific update/create attribute typings
  const [count, rows] = await this.model.update(data as any, updateOpts as any) as [number, TModel[]];
    if (count > 0 && rows[0]) {
      return this.toDomainEntity(rows[0]);
    }
    return null;
  }

  async delete(id: number): Promise<boolean> {
  const count = await this.model.destroy({ where: { id } } as any);
    return count > 0;
  }
}
