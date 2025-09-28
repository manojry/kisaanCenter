import { BaseRepository } from './BaseRepository';
import { Transaction } from '../models/transaction';
import { Op } from 'sequelize';
import { TransactionEntity } from '../entities/TransactionEntity';

/**
 * Transaction Repository Implementation
 */
export class TransactionRepository extends BaseRepository<Transaction, TransactionEntity> {
  /**
   * Find transactions by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<TransactionEntity[]> {
    const models = await this.model.findAll({
      where: {
        created_at: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
      }
    });
    return models.map((model) => this.toDomainEntity(model));
  }
  protected model = Transaction;
  protected entityName = 'Transaction';

  async findByFilters(params: {
    shopId?: number;
    farmerId?: number;
    buyerId?: number;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: 'ASC' | 'DESC';
  }): Promise<{ rows: TransactionEntity[]; count: number }> {
    const where: any = {};
    if (params.shopId) where.shop_id = params.shopId;
    if (params.farmerId) where.farmer_id = params.farmerId;
    if (params.buyerId) where.buyer_id = params.buyerId;
    // Always convert to Date objects before checking validity
    let startDate = params.startDate instanceof Date ? params.startDate : params.startDate ? new Date(params.startDate) : undefined;
    let endDate = params.endDate instanceof Date ? params.endDate : params.endDate ? new Date(params.endDate) : undefined;
    if (startDate && !isNaN(startDate.getTime()) && endDate && !isNaN(endDate.getTime())) {
      where.transaction_date = { [Op.between]: [startDate, endDate] };
    }
    console.log('[TransactionRepository] Parsed date range:', {
      startDate: params.startDate,
      endDate: params.endDate
    });
    console.log('[TransactionRepository] Query filter:', JSON.stringify(where));
    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;
    const allowedOrder = new Set(['transaction_date','created_at','total_amount','farmer_earning']);
    const orderCol = params.orderBy && allowedOrder.has(params.orderBy) ? params.orderBy : 'transaction_date';
    const orderDir = params.orderDir === 'ASC' ? 'ASC' : 'DESC';
    // Include related data in single query to avoid N+1
    const { User } = await import('../models/user');
    const { Shop } = await import('../models/shop');
    const { Payment } = await import('../models/payment');
    
    const { rows, count } = await this.model.findAndCountAll({ 
      where, 
      limit, 
      offset, 
      order: [[orderCol, orderDir]],
      include: [
        {
          model: User,
          as: 'farmer',
          attributes: ['id', 'username', 'firstname'],
          required: false
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'username', 'firstname'],
          required: false
        },
        {
          model: Shop,
          as: 'transactionShop',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'amount', 'method', 'status', 'payer_type', 'payee_type', 'created_at'],
          required: false
        }
      ],
      distinct: true // Important for accurate count with JOINs
    });
    
    // Convert to entities with all related data already loaded
    const rowsWithPayments = rows.map((m: Transaction) => {
      const entity = this.toDomainEntity(m);
      // Payments are already loaded via JOIN
      entity.payments = (m as any).payments?.map((p: any) => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.method,
        status: p.status,
        payer_type: p.payer_type,
        payee_type: p.payee_type,
        created_at: p.created_at
      })) || [];
      return entity;
    });
    return { rows: rowsWithPayments, count };
  }

  /**
   * Convert database model to domain entity
   */
  protected toDomainEntity(model: Transaction): TransactionEntity {
    return new TransactionEntity({
      id: model.id,
      shop_id: model.shop_id,
      farmer_id: model.farmer_id,
      buyer_id: model.buyer_id,
      product_id: (model as any).product_id,
      category_id: model.category_id,
      product_name: model.product_name,
      quantity: Number(model.quantity),
      unit_price: Number(model.unit_price),
      farmer_earning: Number(model.farmer_earning),
        total_amount: Number(model.total_amount),
        commission_amount: Number(model.commission_amount),
      commission_rate: (model as any).commission_rate !== undefined ? Number((model as any).commission_rate) : undefined,
      commission_type: (model as any).commission_type,
      status: (model as any).status,
      transaction_date: (model as any).transaction_date,
      settlement_date: (model as any).settlement_date,
      notes: (model as any).notes,
      metadata: (model as any).metadata,
      created_at: model.created_at,
      updated_at: model.updated_at
    });
  }

  /**
   * Convert domain entity to database model data
   */
  protected toModelData(entity: Partial<TransactionEntity>): any {
    return {
      shop_id: entity.shop_id,
      farmer_id: entity.farmer_id,
      buyer_id: entity.buyer_id,
      product_id: entity.product_id,
      category_id: entity.category_id,
      product_name: entity.product_name,
      quantity: entity.quantity,
      unit_price: entity.unit_price,
  total_amount: entity.total_amount,
      commission_rate: entity.commission_rate,
  commission_amount: entity.commission_amount,
      farmer_earning: entity.farmer_earning,
      status: entity.status,
      transaction_date: entity.transaction_date,
      settlement_date: entity.settlement_date,
      notes: entity.notes,
      metadata: entity.metadata
    };
  }

  /**
   * Find transactions by farmer
   */
  async findByFarmer(farmerId: number): Promise<TransactionEntity[]> {
    const models = await this.model.findAll({
      where: { farmer_id: farmerId }
    });

    return models.map((model) => this.toDomainEntity(model));
  }

  /**
   * Find transactions by buyer
   */
  async findByBuyer(buyerId: number): Promise<TransactionEntity[]> {
    const models = await this.model.findAll({
      where: { buyer_id: buyerId }
    });

    return models.map((model) => this.toDomainEntity(model));
  }

  /**
   * Find transactions by shop
   */
  async findByShop(shopId: number): Promise<TransactionEntity[]> {
    const { User } = await import('../models/user');
    const { Shop } = await import('../models/shop');
    
    const models = await this.model.findAll({
      where: { shop_id: shopId },
      include: [
        {
          model: User,
          as: 'farmer',
          attributes: ['id', 'username', 'firstname'],
          required: false
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'username', 'firstname'],
          required: false
        },
        {
          model: Shop,
          as: 'transactionShop',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return models.map((model) => this.toDomainEntity(model));
  }

  /**
   * Find transactions by status
   */
}