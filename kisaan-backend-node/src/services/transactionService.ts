import { Transaction } from '../models/transaction';
import { Shop } from '../models/shop';
import { User } from '../models/user';
import { Category } from '../models/category';
import { Commission } from '../models/commission';
import { Payment } from '../models/payment';
import { AuditLog } from '../models/auditLog';
import { Op } from 'sequelize';
import { CreateTransactionDTO, TransactionResponseDTO, TransactionSummaryDTO } from '../dtos';

export class TransactionService {
  /**
   * Get all transactions for a buyer, with optional date filtering and aggregation
   */
  async getTransactionsByBuyer(buyerId: number, filters?: { startDate?: Date; endDate?: Date }): Promise<TransactionResponseDTO[]> {
    const where: any = { buyer_id: buyerId };
    if (filters?.startDate && filters?.endDate) {
      where.created_at = {
        [Op.between]: [filters.startDate, filters.endDate]
      };
    }
    const transactions = await Transaction.findAll({
      where,
      include: [
        { model: User, as: 'farmer' },
        { model: User, as: 'buyer' },
        { model: Category, as: 'category' }
      ],
      order: [['created_at', 'DESC']]
    });
    return transactions.map(t => t.toJSON() as TransactionResponseDTO);
  }
  async createTransaction(data: CreateTransactionDTO, userId: number): Promise<TransactionResponseDTO> {
    // Defensive: Validate all referenced entities exist
    const shop = await Shop.findByPk(data.shop_id);
    if (!shop) throw new Error(`Shop with id ${data.shop_id} does not exist`);
    const farmer = await User.findByPk(data.farmer_id);
    if (!farmer) throw new Error(`Farmer with id ${data.farmer_id} does not exist`);
    const buyer = await User.findByPk(data.buyer_id);
    if (!buyer) throw new Error(`Buyer with id ${data.buyer_id} does not exist`);
    const category = await Category.findByPk(data.category_id);
    if (!category) throw new Error(`Category with id ${data.category_id} does not exist`);

    // Get shop commission rate
    const commission = await Commission.findOne({ 
      where: { shop_id: data.shop_id },
      order: [['created_at', 'DESC']]
    });
    const commissionRate = commission?.rate || 10;
    const totalSaleValue = data.quantity * data.unit_price;
    const shopCommission = (totalSaleValue * commissionRate) / 100;
    const farmerEarning = totalSaleValue - shopCommission;

    const transaction = await Transaction.create({
      ...data,
      total_sale_value: totalSaleValue,
      shop_commission: shopCommission,
      farmer_earning: farmerEarning
    });

    if (!transaction || !transaction.id) {
      throw new Error('Transaction creation failed: No valid transaction ID returned');
    }

    // After transaction is created and variables are defined
    // Farmer's balance increases by earning
    await User.increment({ balance: farmerEarning, cumulative_value: farmerEarning }, { where: { id: data.farmer_id } });
    // Buyer's balance decreases by total sale value
    await User.increment({ balance: -totalSaleValue, cumulative_value: totalSaleValue }, { where: { id: data.buyer_id } });
    // Owner/shop cumulative_value increases by commission (if owner exists)
    if (shop && shop.owner_id) {
      await User.increment({ cumulative_value: shopCommission }, { where: { id: shop.owner_id } });
    }

    // Create audit log
    await AuditLog.create({
      shop_id: data.shop_id,
      user_id: userId || 1, // Default to 1 if userId is null
      action: 'transaction_created',
      entity_type: 'transaction',
      entity_id: transaction.id,
      new_values: JSON.stringify(transaction.toJSON())
    });

    return transaction.toJSON() as TransactionResponseDTO;
  }
  async getTransactionById(id: number): Promise<TransactionResponseDTO | null> {
    const transaction = await Transaction.findByPk(id, {
      include: [
        { model: Shop, as: 'transactionShop' },
        { model: User, as: 'farmer' },
        { model: User, as: 'buyer' },
        { model: Category, as: 'category' },
        { model: Payment, as: 'payments' }
      ]
    });
    
    return transaction ? transaction.toJSON() as TransactionResponseDTO : null;
  }
  async getTransactionsByShop(shopId: number, filters?: {
    startDate?: Date;
    endDate?: Date;
    farmerId?: number;
    buyerId?: number;
  }): Promise<TransactionResponseDTO[]> {
    const where: any = { shop_id: shopId };
    
    if (filters?.startDate && filters?.endDate) {
      where.created_at = {
        [Op.between]: [filters.startDate, filters.endDate]
      };
    }
    
    if (filters?.farmerId) where.farmer_id = filters.farmerId;
    if (filters?.buyerId) where.buyer_id = filters.buyerId;

    const transactions = await Transaction.findAll({
      where,
      include: [
        { model: User, as: 'farmer' },
        { model: User, as: 'buyer' },
        { model: Category, as: 'category' }
      ],
      order: [['created_at', 'DESC']]
    });

    return transactions.map(t => t.toJSON() as TransactionResponseDTO);
  }

  async getShopEarnings(shopId: number, period?: { start: Date; end: Date }): Promise<TransactionSummaryDTO> {
    const where: any = { shop_id: shopId };
    
    if (period) {
      where.created_at = {
        [Op.between]: [period.start, period.end]
      };
    }

    const transactions = await Transaction.findAll({ where });
    
    return {
      total_transactions: transactions.length,
      total_sales: transactions.reduce((sum, t) => sum + Number(t.total_sale_value), 0),
      total_commission: transactions.reduce((sum, t) => sum + Number(t.shop_commission), 0),
      total_farmer_earnings: transactions.reduce((sum, t) => sum + Number(t.farmer_earning), 0)
    };
  }
  async getFarmerEarnings(farmerId: number, shopId?: number, period?: { start: Date; end: Date }) {
    const where: any = { farmer_id: farmerId };
    
    if (shopId) where.shop_id = shopId;
    if (period) {
      where.created_at = {
        [Op.between]: [period.start, period.end]
      };
    }

    const transactions = await Transaction.findAll({ where });
    
    return {
      totalTransactions: transactions.length,
      totalEarnings: transactions.reduce((sum, t) => sum + Number(t.farmer_earning), 0),
      transactions: transactions.map(t => t.toJSON() as TransactionResponseDTO)
    };
  }
}