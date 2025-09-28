// src/repositories/BaseRepository.ts
// Generic base repository for CRUD operations
import { Model, FindOptions, Op } from 'sequelize';

export abstract class BaseRepository<TModel extends Model, TEntity> {
  protected abstract model: any;
  protected abstract entityName: string;

  protected abstract toDomainEntity(model: TModel): TEntity;
  protected abstract toModelData(entity: TEntity): any;

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
    const createOpts: any = {};
    if (options?.tx) createOpts.transaction = options.tx;
    const result = await this.model.create(data, createOpts);
    return this.toDomainEntity(result);
  }

  async update(id: number, entity: TEntity, options?: { tx?: any }): Promise<TEntity | null> {
    const data = this.toModelData(entity);
    const updateOpts: any = { where: { id }, returning: true };
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
