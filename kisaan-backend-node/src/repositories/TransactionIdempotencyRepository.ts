import { BaseRepository } from './BaseRepository';
import { Model } from 'sequelize';

export interface IdempotencyRecordEntity {
  id?: number;
  key: string;
  buyer_id: number;
  farmer_id: number;
  shop_id: number;
  total_amount: number;
  transaction_id?: number | null;
  created_at?: Date;
}

export class TransactionIdempotencyRepository extends BaseRepository<Model, IdempotencyRecordEntity> {
  protected model: any;
  protected entityName = 'TransactionIdempotency';

  constructor() {
    super();
    const { TransactionIdempotency } = require('../models/index');
    this.model = TransactionIdempotency; // Expect model defined externally
  }

  protected toDomainEntity(model: Model): IdempotencyRecordEntity {
    const json = model.toJSON();
    return {
      id: json.id,
      key: json.key,
      buyer_id: json.buyer_id,
      farmer_id: json.farmer_id,
      shop_id: json.shop_id,
      total_amount: Number(json.total_amount),
      transaction_id: json.transaction_id ?? null,
      created_at: json.created_at ? new Date(json.created_at) : undefined
    };
  }

  protected toModelData(entity: IdempotencyRecordEntity): any {
    return { ...entity };
  }

  async findByKey(key: string): Promise<IdempotencyRecordEntity | null> {
    const rec = await this.model.findOne({ where: { key } });
    return rec ? this.toDomainEntity(rec) : null;
  }

  async createRecord(data: IdempotencyRecordEntity, opts?: { tx?: any }): Promise<IdempotencyRecordEntity> {
    const created = await this.model.create(data, opts?.tx ? { transaction: opts.tx } : undefined);
    return this.toDomainEntity(created);
  }

  async attachTransaction(key: string, transactionId: number, opts?: { tx?: any }): Promise<void> {
    await this.model.update({ transaction_id: transactionId }, { where: { key }, transaction: opts?.tx });
  }
}