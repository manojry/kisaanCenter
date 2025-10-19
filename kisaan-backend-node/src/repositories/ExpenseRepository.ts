import Expense, { ExpenseStatus } from '../models/expense';
import ExpenseSettlement from '../models/expenseSettlement';
import { DomainError } from '../errors/DomainError';

export class ExpenseRepository {
  async create(data: Partial<typeof Expense>, options?: { tx?: import('sequelize').Transaction }) {
    try {
      const createOpts = options?.tx ? { transaction: options.tx } : undefined;
      return await Expense.create(data as any, createOpts as any);
    } catch (err) {
      throw new DomainError(`Failed to create expense: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async findPendingByUser(shopId: number, userId: number, options?: { tx?: import('sequelize').Transaction }) {
    try {
      const findOpts: any = { where: { shop_id: shopId, user_id: userId, status: ExpenseStatus.Pending }, order: [['created_at', 'ASC']] };
      if (options?.tx) findOpts.transaction = options.tx;
      return await Expense.findAll(findOpts);
    } catch (err) {
      throw new DomainError(`Failed to fetch pending expenses: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async markSettled(expenseId: number, options?: { tx?: import('sequelize').Transaction }) {
    try {
      const findOpts = options?.tx ? { transaction: options.tx } : undefined;
      const e = await Expense.findByPk(expenseId, findOpts as any);
      if (!e) throw new DomainError('Expense not found');
      e.status = ExpenseStatus.Settled;
      await e.save(options?.tx ? { transaction: options.tx } as any : undefined);
      return e;
    } catch (err) {
      throw new DomainError(`Failed to mark expense settled: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async findAllByShop(shopId: number, options?: { tx?: import('sequelize').Transaction }) {
    try {
      const findOpts: any = { where: { shop_id: shopId }, order: [['created_at', 'ASC']] };
      if (options?.tx) findOpts.transaction = options.tx;
      return await Expense.findAll(findOpts);
    } catch (err) {
      throw new DomainError(`Failed to fetch expenses by shop: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async getPendingTotal(shopId: number, userId: number, options?: { tx?: import('sequelize').Transaction }): Promise<number> {
    try {
      const sumOpts: any = { where: { shop_id: shopId, user_id: userId, status: ExpenseStatus.Pending } };
      if (options?.tx) sumOpts.transaction = options.tx;
      const sum = await Expense.sum('amount', sumOpts);
      return Number(sum || 0);
    } catch (err) {
      throw new DomainError(`Failed to sum pending expenses: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

export default ExpenseRepository;
