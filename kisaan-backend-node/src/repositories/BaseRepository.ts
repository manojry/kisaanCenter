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
    // The sequelize ModelStatic create signature is model-specific and its
    // generics make a clean typing here noisy. We perform a narrow cast to
    // a safer unknown-typed function via unknown to call it while keeping the rest of
    // the repository strongly typed.
    const createFn = this.model.create as unknown as (values: unknown, options?: unknown) => Promise<TModel>;
    const result = await createFn(data as unknown, createOpts as unknown);
    return this.toDomainEntity(result);
  }

  async update(id: number, entity: TEntity, options?: { tx?: unknown }): Promise<TEntity | null> {
    const data = this.toModelData(entity);
    const updateOpts: { where: { id: number }; returning: boolean; transaction?: Transaction } = { where: { id }, returning: true };
    if (options?.tx) updateOpts.transaction = options.tx as Transaction;
  // Similar narrow cast for update: call through an unknown-typed function to
  // avoid fighting Sequelize's complex generics at every repository.
  const updateFn = this.model.update as unknown as (values: unknown, options?: unknown) => Promise<[number, TModel[]]>;
  const [count, rows] = await updateFn(data as unknown, updateOpts as unknown);
    if (count > 0 && rows[0]) {
      return this.toDomainEntity(rows[0]);
    }
    return null;
  }

  async delete(id: number): Promise<boolean> {
  const destroyFn = this.model.destroy as unknown as (options?: unknown) => Promise<number>;
  const count = await destroyFn({ where: { id } } as unknown);
    return count > 0;
  }
}
