import Expense, { ExpenseStatus, ExpenseCreationAttributes } from '../models/expense';
import { DomainError } from '../errors/DomainError';
import { FindOptions, Transaction } from 'sequelize';

export class ExpenseRepository {
  async create(data: ExpenseCreationAttributes, options?: { tx?: import('sequelize').Transaction }) {
    try {
      const createOpts = options?.tx ? { transaction: options.tx } : undefined;
      return await Expense.create(data, createOpts);
    } catch (err) {
      throw new DomainError(`Failed to create expense: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async findPendingByUser(shopId: number, userId: number, options?: { tx?: Transaction }) {
    try {
      const findOpts: FindOptions = { 
        where: { shop_id: shopId, user_id: userId, status: ExpenseStatus.Pending }, 
        order: [['created_at', 'ASC']] 
      };
      if (options?.tx) findOpts.transaction = options.tx;
      return await Expense.findAll(findOpts);
    } catch (err) {
      throw new DomainError(`Failed to fetch pending expenses: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async markSettled(expenseId: number, options?: { tx?: Transaction }) {
    try {
      const findOpts: FindOptions = {};
      if (options?.tx) findOpts.transaction = options.tx;
      const e = await Expense.findByPk(expenseId, findOpts);
      if (!e) throw new DomainError('Expense not found');
      e.status = ExpenseStatus.Settled;
      const saveOpts: { transaction?: Transaction } = {};
      if (options?.tx) saveOpts.transaction = options.tx;
      await e.save(saveOpts);
      return e;
    } catch (err) {
      throw new DomainError(`Failed to mark expense settled: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async findAllByShop(shopId: number, options?: { tx?: Transaction }) {
    try {
      const findOpts: FindOptions = { 
        where: { shop_id: shopId }, 
        order: [['created_at', 'ASC']] 
      };
      if (options?.tx) findOpts.transaction = options.tx;
      return await Expense.findAll(findOpts);
    } catch (err) {
      throw new DomainError(`Failed to fetch expenses by shop: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async getPendingTotal(shopId: number, userId: number, options?: { tx?: Transaction }): Promise<number> {
    try {
      const sumOpts: { where: { shop_id: number; user_id: number; status: ExpenseStatus }; transaction?: Transaction } = { 
        where: { shop_id: shopId, user_id: userId, status: ExpenseStatus.Pending } 
      };
      if (options?.tx) sumOpts.transaction = options.tx;
      const sum = await Expense.sum('amount', sumOpts);
      return Number(sum || 0);
    } catch (err) {
      throw new DomainError(`Failed to sum pending expenses: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

export default ExpenseRepository;
