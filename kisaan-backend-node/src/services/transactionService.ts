import { sequelize } from '../models/index';
/**
 * Transaction Service
 * Business logic layer for Transaction operations
 * Follows clean architecture: Controller -> Service -> Repository -> Database
 */

import { TransactionRepository } from '../repositories/TransactionRepository';
import { TransactionIdempotencyRepository } from '../repositories/TransactionIdempotencyRepository';
import { UserRepository } from '../repositories/UserRepository';
import { ShopRepository } from '../repositories/ShopRepository';
import { TransactionEntity } from '../entities/TransactionEntity';
import { ProductRepository } from '../repositories/ProductRepository';
import { FarmerProductAssignmentRepository } from '../repositories/FarmerProductAssignmentRepository';
import { TransactionLedgerRepository } from '../repositories/TransactionLedgerRepository';
import { UserEntity } from '../entities/UserEntity';
import { ValidationError, NotFoundError, BusinessRuleError, AuthorizationError, DatabaseError } from '../shared/utils/errors';

import { USER_ROLES, TRANSACTION_STATUS } from '../shared/constants';

export class TransactionService {
  private transactionRepository: TransactionRepository;
  private userRepository: UserRepository;
  private shopRepository: ShopRepository;
  private productRepository: ProductRepository;
  private ledgerRepository: TransactionLedgerRepository;
  private farmerProductRepo: FarmerProductAssignmentRepository;
  private idempotencyRepo: TransactionIdempotencyRepository;

  constructor() {
    this.transactionRepository = new TransactionRepository();
    this.userRepository = new UserRepository();
  this.shopRepository = new ShopRepository();
  this.productRepository = new ProductRepository();
  this.ledgerRepository = new TransactionLedgerRepository();
  this.farmerProductRepo = new FarmerProductAssignmentRepository();
    this.idempotencyRepo = new TransactionIdempotencyRepository();
  }

  private resolveCommissionRate(
    dataRate: number | undefined,
    farmer: { custom_commission_rate?: number | null } | null,
    shop: { commission_rate?: number | null } | null
  ): number {
    // Commission precedence (highest to lowest):
    // 1. Explicit rate passed in payload (dataRate)
    // 2. Farmer custom override (farmer.custom_commission_rate) – user-level rate
    // 3. Shop default commission_rate
    // 4. Fallback constant (10%) if nothing configured (legacy safety)
    try {
      console.debug('[transaction:commission:inputs]', {
        provided: dataRate,
        farmerCustom: farmer?.custom_commission_rate,
        shopCommission: shop?.commission_rate
      });
    } catch (err) {
      /* intentionally ignore debug errors */
    }
    if (typeof dataRate === 'number' && !isNaN(dataRate)) return dataRate;
    if (farmer?.custom_commission_rate != null) return Number(farmer.custom_commission_rate);
    if (shop?.commission_rate != null) return Number(shop.commission_rate);
    return 10;
  }

  private async resolveProductIdAndName(input: { product_id?: number | null; product_name?: string; farmer_id: number }) {
  let assignments: import('../repositories/FarmerProductAssignmentRepository').FarmerProductAssignmentEntity[] = [];
    try {
      assignments = await this.farmerProductRepo.findByFarmer(input.farmer_id);
  } catch (e: unknown) {
      // Extra safety (should already be handled in repository)
      let msg = '';
      let code = '';
      if (typeof e === 'object' && e !== null) {
        if ('message' in e && typeof (e as { message?: unknown }).message === 'string') {
          msg = (e as { message?: string }).message as string;
        }
        if ('original' in e && typeof (e as { original?: { code?: unknown } }).original === 'object' && (e as { original?: { code?: unknown } }).original !== null) {
          const orig = (e as { original?: { code?: unknown } }).original;
          if (orig && typeof orig.code === 'string') {
            code = orig.code;
          }
        }
      }
      if (msg.includes('farmer_product_assignments') || code === '42P01') {
        console.warn('[transactionService] Missing farmer_product_assignments table – using empty assignment list fallback');
        assignments = [];
      } else {
        throw e;
      }
    }
  const assignedIds = new Set(assignments.map(a => Number(a.product_id)));
  try { console.debug('[transaction:resolveProduct] assignments', { farmer: input.farmer_id, assignments, input }); } catch (err) { /* ignore debug errors */ }
    let resolvedProductId: number | undefined;
  const normalizedName = input.product_name?.trim();
    if (input.product_id) {
      if (assignments.length && !assignedIds.has(Number(input.product_id))) {
  try { console.warn('[transaction:resolveProduct] Provided product_id not in assignedIds', { provided: input.product_id, assignedIds: Array.from(assignedIds) }); } catch (err) { /* ignore warn errors */ }
        throw new BusinessRuleError('Product not assigned to farmer');
      }
      resolvedProductId = Number(input.product_id);
    } else if (normalizedName) {
      const lowered = normalizedName.toLowerCase();
      if (assignments.length) {
  // ...existing code...
        const ids = Array.from(assignedIds);
        if (ids.length) {
          const placeholders = ids.map(() => '?').join(',');
          const [rows] = await sequelize.query(`SELECT id, name FROM kisaan_products WHERE id IN (${placeholders})`, { replacements: ids });
          if (Array.isArray(rows)) {
            const match = (rows as Array<{ id: number; name: string }>).find((r) => (r.name || '').toLowerCase() === lowered);
            if (match) {
              resolvedProductId = match.id;
            }
          }
        }
      }
      if (!resolvedProductId && assignments.length === 1) {
        resolvedProductId = assignments[0].product_id;
      }
    } else {
      if (assignments.length === 1) {
        resolvedProductId = assignments[0].product_id;
      } else {
        throw new ValidationError('product_id or product_name required');
      }
    }
    if (!resolvedProductId) {
      // Fallback: allow provided product_id when no assignments exist OR when assignments feature is disabled
      if (!assignments.length && input.product_id) {
        resolvedProductId = Number(input.product_id);
      } else {
        throw new BusinessRuleError('Unable to resolve product within farmer assignments');
      }
    }
    return { productId: resolvedProductId, name: normalizedName || '' };
  }

  /**
   * Create a new transaction
   */
  async createTransaction(data: {
    shop_id: number;
    farmer_id: number;
    buyer_id: number;
  product_id?: number | null; // Provided or resolved from name
  category_id: number;
  product_name: string; // Kept for backward compatibility (normalization WIP)
    quantity: number;
    unit_price: number;
    commission_rate?: number;
    transaction_date?: Date;
    notes?: string;
  }, requestingUser?: { role: string; id: number }, options?: { tx?: import('sequelize').Transaction, idempotencyKey?: string }): Promise<TransactionEntity> {
    try {
      // Validate required fields
      if (!data.shop_id || !data.farmer_id || !data.buyer_id) {
        throw new ValidationError('Shop ID, Farmer ID, and Buyer ID are required');
      }
      if (!data.category_id) {
        throw new ValidationError('Category ID is required');
      }
      // product_name may be omitted if farmer has exactly one assigned/default product
      const rawProductName = data.product_name?.trim();
      if (!rawProductName) {
        // Peek assignments early (cheap fetch) to decide if omission is acceptable
        try {
          const assignmentsQuick = await this.farmerProductRepo.findByFarmer(data.farmer_id);
          if (!assignmentsQuick.length) {
            throw new ValidationError('Product name required (no assignments)');
          }
          if (assignmentsQuick.length > 1 && !assignmentsQuick.some(a => a.is_default)) {
            throw new ValidationError('Ambiguous products: provide product_name or set a default');
          }
          // We will resolve canonical product name later; temporarily set placeholder to pass downstream logic
          (data as Record<string, unknown>).product_name = '__AUTO_RESOLVE__';
        } catch (e) {
          if (e instanceof ValidationError) throw e;
          // Fallback to strict requirement if repo fails
          throw new ValidationError('Product name is required');
        }
      }
      if (!data.quantity || data.quantity <= 0) {
        throw new ValidationError('Valid quantity is required');
      }
      if (!data.unit_price || data.unit_price <= 0) {
        throw new ValidationError('Valid unit price is required');
      }

      // Upper bounds to catch accidental gigantic values
      if (data.quantity > 1_000_000) throw new ValidationError('Quantity too large');
      if (data.unit_price > 100_000_000) throw new ValidationError('Unit price too large');

      // Parallel entity fetch (shop, farmer, buyer, assignments for product resolution)
      const [shop, farmer, buyer, assignments] = await Promise.all([
        this.shopRepository.findById(data.shop_id),
        this.userRepository.findById(data.farmer_id),
        this.userRepository.findById(data.buyer_id),
        this.farmerProductRepo.findByFarmer(data.farmer_id)
      ]);

      if (!shop) {
        throw new NotFoundError('Shop not found');
      }
      if (!farmer || farmer.role !== USER_ROLES.FARMER) {
        throw new NotFoundError('Farmer not found or invalid role');
      }
      if (!buyer || buyer.role !== USER_ROLES.BUYER) {
        throw new NotFoundError('Buyer not found or invalid role');
      }

      if (farmer.id === buyer.id) {
        throw new BusinessRuleError('Farmer and buyer cannot be the same user');
      }

      // Authorization check - Debug info
      console.log('[DEBUG] Authorization check:', {
        requestingUserRole: requestingUser?.role,
        requestingUserId: requestingUser?.id,
        shopOwnerId: shop.owner_id,
        shopId: shop.id,
        farmerShopId: farmer.shop_id,
        farmerId: farmer.id
      });
      
      // Fix type comparison issues by converting to numbers
      if (requestingUser?.role === USER_ROLES.OWNER && Number(shop.owner_id) !== Number(requestingUser.id)) {
        throw new AuthorizationError('Cannot create transaction for another owner\'s shop');
      }
      
      // Allow farmers to create transactions only for the shop they belong to
      if (requestingUser?.role === USER_ROLES.FARMER && Number(farmer.shop_id) !== Number(shop.id)) {
        throw new AuthorizationError('Cannot create transaction for a shop you do not belong to');
      }
      // Product resolution leveraging existing assignments
      const { productId: resolvedProductId } = await this.resolveProductIdAndName({
        product_id: data.product_id,
        product_name: data.product_name,
        farmer_id: data.farmer_id
      });
      try {
        const assignmentCount = assignments?.length || 0;
        console.debug('[transaction:product:resolution]', {
          farmer: data.farmer_id,
            requestedName: data.product_name,
          providedProductId: data.product_id,
            resolvedProductId,
          assignmentCount
        });
      } catch (err) {
        /* intentionally ignore debug errors */
      }

      // Canonical product name fetch
      // Preserve explicit user-provided product_name. We only replace when:
      // 1. The placeholder '__AUTO_RESOLVE__' was injected earlier OR
      // 2. No product_name provided at all (empty) and we successfully resolved productId.
      const originalProvidedName = (data.product_name || '').trim();
      let canonicalProductName = originalProvidedName;
      try {
        if (resolvedProductId) {
          // ...existing code...
          const [prodRows] = await sequelize.query('SELECT name FROM kisaan_products WHERE id = ? LIMIT 1', { replacements: [resolvedProductId] });
          if (Array.isArray(prodRows) && prodRows[0] && typeof prodRows[0] === 'object' && 'name' in prodRows[0]) {
            const catalogName = String((prodRows[0] as { name: string }).name);
            if (!originalProvidedName || originalProvidedName === '__AUTO_RESOLVE__') {
              // Safe to adopt catalog canonical name when user did not explicitly choose a name
              canonicalProductName = catalogName;
            } else {
              // Keep the user provided name but we could log divergence for future normalization
              if (originalProvidedName.toLowerCase() !== catalogName.toLowerCase()) {
                try { console.debug('[transaction:product:name-preserve]', { provided: originalProvidedName, catalog: catalogName }); } catch (err) { /* ignore debug errors */ }
              }
            }
          }
        }
      } catch (err) {
        /* fallback silently; can log later if needed */
      }
      if (canonicalProductName === '__AUTO_RESOLVE__') {
        // Should have been replaced by product catalog lookup; if still placeholder, reject
        throw new ValidationError('Unable to auto-resolve product name');
      }

      // Determine commission rate precedence
      const commissionRate = this.resolveCommissionRate(data.commission_rate, farmer, shop);
      if (commissionRate < 0 || commissionRate > 100) {
        throw new ValidationError('Invalid commission rate');
      }
      const normalizedCommissionRate = Number((commissionRate).toFixed(2));
      // Calculate transaction amounts
      const totalAmount = data.quantity * data.unit_price;
      const commissionAmount = (totalAmount * commissionRate) / 100;
      const farmerEarning = totalAmount - commissionAmount;

      // Invariant check
      if (Math.abs((commissionAmount + farmerEarning) - totalAmount) > 0.01) {
        throw new BusinessRuleError('Computed financial fields inconsistent');
      }

      // Idempotency early return
      if (options?.idempotencyKey) {
        const existingKey = await this.idempotencyRepo.findByKey(options.idempotencyKey);
        if (existingKey?.transaction_id) {
          const existing = await this.transactionRepository.findById(existingKey.transaction_id);
          if (existing) return existing;
        }
      }

      // Construct entity (canonical fields only)
      const transactionEntity = new TransactionEntity({
        shop_id: data.shop_id,
        farmer_id: data.farmer_id,
        buyer_id: data.buyer_id,
        category_id: data.category_id,
        product_name: canonicalProductName,
        product_id: resolvedProductId,
        quantity: data.quantity,
        unit_price: data.unit_price,
        total_amount: totalAmount,
        commission_rate: normalizedCommissionRate,
        commission_amount: commissionAmount,
        farmer_earning: farmerEarning,
        status: TRANSACTION_STATUS.PENDING,
        transaction_date: data.transaction_date || new Date(),
        notes: data.notes?.trim() || null
      });

      let createdTransaction: TransactionEntity | undefined;
  // ...existing code...
      const externalTx = options?.tx;
  const run = async (tx: import('sequelize').Transaction) => {
        if (options?.idempotencyKey) {
          const existing = await this.idempotencyRepo.findByKey(options.idempotencyKey);
          if (!existing) {
            await this.idempotencyRepo.createRecord({
              key: options.idempotencyKey,
              buyer_id: data.buyer_id,
              farmer_id: data.farmer_id,
              shop_id: data.shop_id,
              total_amount: totalAmount,
              transaction_id: null
            }, { tx });
          }
        }
        // Debug: log raw transaction entity values before persistence
        try {
          console.debug('[transaction:debug:persist-payload]', {
            shop_id: transactionEntity.shop_id,
            farmer_id: transactionEntity.farmer_id,
            buyer_id: transactionEntity.buyer_id,
            category_id: transactionEntity.category_id,
            product_name: transactionEntity.product_name,
            quantity: transactionEntity.quantity,
            unit_price: transactionEntity.unit_price,
            total_amount: transactionEntity.total_amount,
            commission_amount: transactionEntity.commission_amount,
            farmer_earning: transactionEntity.farmer_earning,
            commission_rate: transactionEntity.commission_rate,
            commission_type: transactionEntity.commission_type,
            product_id: transactionEntity.product_id,
            status: transactionEntity.status,
            transaction_date: transactionEntity.transaction_date
          });
        } catch (err) {
          /* intentionally ignore debug errors */
        }
        createdTransaction = await this.transactionRepository.create(transactionEntity, { tx });
        await this.updateUserBalances(farmer, buyer, farmerEarning, totalAmount, tx);
        // Ledger entries - ensure numeric conversion to prevent string concatenation
        const farmerBalanceBefore = Number(farmer.balance || 0);
        const buyerBalanceBefore = Number(buyer.balance || 0);
        
        await this.ledgerRepository.create({
          transaction_id: (createdTransaction as { id: number }).id,
          user_id: farmer.id!,
          role: 'farmer',
          delta_amount: Number(farmerEarning),
          balance_before: farmerBalanceBefore,
          balance_after: farmerBalanceBefore + Number(farmerEarning),
          reason_code: 'TXN_POST'
        }, { tx });
        await this.ledgerRepository.create({
          transaction_id: (createdTransaction as { id: number }).id,
          user_id: buyer.id!,
          role: 'buyer',
          delta_amount: Number(totalAmount),
          balance_before: buyerBalanceBefore,
          balance_after: buyerBalanceBefore + Number(totalAmount),
          reason_code: 'TXN_POST'
        }, { tx });
        if (options?.idempotencyKey) {
          await this.idempotencyRepo.attachTransaction(options.idempotencyKey, (createdTransaction as { id: number }).id, { tx });
        }
      };

      if (externalTx) {
        await run(externalTx);
      } else if (sequelize?.transaction) {
        await sequelize.transaction(async (t: import('sequelize').Transaction) => {
          await run(t);
        });
      } else {
        throw new DatabaseError('No transaction context available for creating transaction');
      }

      if (!createdTransaction) {
        throw new DatabaseError('Transaction creation failed (no result)');
      }

      try {
        console.info('[transaction:create]', {
          id: (createdTransaction as { id: number }).id,
          shop: data.shop_id,
          farmer: data.farmer_id,
          buyer: data.buyer_id,
          totalAmount,
          commissionAmount,
          commissionRate: transactionEntity.commission_rate,
          commissionSource: (typeof data.commission_rate === 'number'
            ? 'payload'
            : (((farmer as { custom_commission_rate?: number | null })?.custom_commission_rate != null)
              ? 'farmer_custom'
              : (((shop as { commission_rate?: number | null })?.commission_rate != null) ? 'shop_default' : 'fallback'))),
          idem: options?.idempotencyKey || null
        });
      } catch (err) {
        /* intentionally ignore debug errors */
      }
      return createdTransaction;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || 
          error instanceof BusinessRuleError || error instanceof AuthorizationError) {
        throw error;
      }
      try {
        console.error('[transaction:create:raw-error]', error);
      } catch (err) {
        /* intentionally ignore debug errors */
      }
  throw new DatabaseError('Failed to create transaction', error instanceof Error ? { message: error.message, stack: (error as Error).stack } : undefined);
    }
  }

  /**
   * Quick transaction creation consolidating route logic.
   * Accepts minimal payload and delegates to createTransaction after resolving product.
   */
  async createQuickTransaction(input: {
    shop_id?: number;
    farmer_id: number;
    buyer_id: number;
    product_id?: number | null;
    product_name?: string;
    category_id?: number;
    quantity: number;
    unit_price: number;
  }, requestingUser?: { role: string; id: number }): Promise<TransactionEntity> {
    const shopId = input.shop_id;
    const categoryId = input.category_id || 1;
    if (!shopId) throw new ValidationError('Shop ID required');
    const productName = input.product_name || '';
    return this.createTransaction({
      shop_id: shopId,
      farmer_id: input.farmer_id,
      buyer_id: input.buyer_id,
      category_id: categoryId,
      product_name: productName,
      product_id: input.product_id ?? undefined,
      quantity: input.quantity,
      unit_price: input.unit_price
    }, requestingUser);
  }

  /**
   * Get transactions by buyer
   */
  async getTransactionsByBuyer(buyerId: number, filters?: {
    startDate?: Date;
    endDate?: Date;
  }, requestingUser?: { role: string; id: number }): Promise<TransactionEntity[]> {
    try {
      // Authorization check
      if (requestingUser?.role === USER_ROLES.BUYER && requestingUser.id !== buyerId) {
        throw new AuthorizationError('Cannot view another buyer\'s transactions');
      }

      if (filters?.startDate && filters?.endDate) {
        return await this.transactionRepository.findByDateRange(filters.startDate, filters.endDate);
      }

      return await this.transactionRepository.findByBuyer(buyerId);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        throw error;
      }
      throw new DatabaseError('Failed to retrieve buyer transactions', error instanceof Error ? { message: error.message } : undefined);
    }
  }

  /**
   * Get transactions by farmer
   */
  async getTransactionsByFarmer(farmerId: number, filters?: {
    startDate?: Date;
    endDate?: Date;
  }, requestingUser?: { role: string; id: number }): Promise<TransactionEntity[]> {
    try {
      // Authorization check
      if (requestingUser?.role === USER_ROLES.FARMER && requestingUser.id !== farmerId) {
        throw new AuthorizationError('Cannot view another farmer\'s transactions');
      }

      if (filters?.startDate && filters?.endDate) {
        return await this.transactionRepository.findByDateRange(filters.startDate, filters.endDate);
      }

      return await this.transactionRepository.findByFarmer(farmerId);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        throw error;
      }
      throw new DatabaseError('Failed to retrieve farmer transactions', error instanceof Error ? { message: error.message } : undefined);
    }
  }

  /**
   * Get transactions by shop
   */
  async getTransactionsByShop(shopId: number, filters?: {
    startDate?: Date;
    endDate?: Date;
    farmerId?: number;
    buyerId?: number;
  }, requestingUser?: { role: string; id: number }): Promise<TransactionEntity[]> {
    try {
      // Authorization check for shop access
      if (requestingUser?.role === USER_ROLES.OWNER) {
        const shop = await this.shopRepository.findById(shopId);
        if (!shop || shop.owner_id !== requestingUser.id) {
          throw new AuthorizationError('Cannot view another owner\'s shop transactions');
        }
      }

      let transactions = await this.transactionRepository.findByShop(shopId);

      // Apply filters
      if (filters?.farmerId) {
        transactions = transactions.filter(t => t.farmer_id === filters.farmerId);
      }
      if (filters?.buyerId) {
        transactions = transactions.filter(t => t.buyer_id === filters.buyerId);
      }
      if (filters?.startDate && filters?.endDate) {
        transactions = transactions.filter(t => 
          t.transaction_date && 
          t.transaction_date >= filters.startDate! && 
          t.transaction_date <= filters.endDate!
        );
      }

      return transactions;
    } catch (error) {
      if (error instanceof AuthorizationError) {
        throw error;
      }
      throw new DatabaseError('Failed to retrieve shop transactions', error instanceof Error ? { message: error.message } : undefined);
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: number, requestingUser?: { role: string; id: number }): Promise<TransactionEntity> {
    try {
      if (!id || id <= 0) {
        throw new ValidationError('Valid transaction ID is required');
      }

      const transaction = await this.transactionRepository.findById(id);
      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }

      // Authorization check
      if (requestingUser?.role === USER_ROLES.FARMER && transaction.farmer_id !== requestingUser.id) {
        throw new AuthorizationError('Cannot view this transaction');
      }
      if (requestingUser?.role === USER_ROLES.BUYER && transaction.buyer_id !== requestingUser.id) {
        throw new AuthorizationError('Cannot view this transaction');
      }
      if (requestingUser?.role === USER_ROLES.OWNER) {
        const shop = await this.shopRepository.findById(transaction.shop_id!);
        if (!shop || shop.owner_id !== requestingUser.id) {
          throw new AuthorizationError('Cannot view this transaction');
        }
      }

      return transaction;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
        throw error;
      }
      throw new DatabaseError('Failed to retrieve transaction', error instanceof Error ? { message: error.message } : undefined);
    }
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(id: number, status: string, requestingUser?: { role: string; id: number }): Promise<TransactionEntity> {
    try {
      const transaction = await this.getTransactionById(id, requestingUser);

      // Validate status
      const validStatuses = Object.values(TRANSACTION_STATUS);
      if (!validStatuses.includes(status as import('../shared/constants').TransactionStatus)) {
        throw new ValidationError('Invalid transaction status');
      }

      const updatedEntity = new TransactionEntity({
        ...transaction,
        status: status as import('../shared/constants').TransactionStatus
      });

      const updatedTransaction = await this.transactionRepository.update(id, updatedEntity);
      if (!updatedTransaction) {
        throw new DatabaseError('Transaction update failed or transaction not found');
      }
      return updatedTransaction;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
        throw error;
      }
      throw new DatabaseError('Failed to update transaction status', error instanceof Error ? { message: error.message } : undefined);
    }
  }

  /**
   * Get transaction summary for shop
   */
  async getTransactionSummary(shopId: number, startDate?: Date, endDate?: Date): Promise<{
    totalTransactions: number;
    totalAmount: number;
    totalCommission: number;
    totalFarmerEarnings: number;
  }> {
    try {
      const transactions = await this.transactionRepository.findByShop(shopId);
      
      let filteredTransactions = transactions;
      if (startDate && endDate) {
        filteredTransactions = transactions.filter(t => 
          t.transaction_date && 
          t.transaction_date >= startDate && 
          t.transaction_date <= endDate
        );
      }

      const summary = filteredTransactions.reduce((acc, transaction) => {
        return {
          totalTransactions: acc.totalTransactions + 1,
          totalAmount: acc.totalAmount + (transaction.total_amount || 0),
          totalCommission: acc.totalCommission + (transaction.commission_amount || 0),
          totalFarmerEarnings: acc.totalFarmerEarnings + (transaction.farmer_earning || 0)
        };
      }, {
        totalTransactions: 0,
        totalAmount: 0,
        totalCommission: 0,
        totalFarmerEarnings: 0
      });

      return summary;
    } catch (error) {
      throw new DatabaseError('Failed to get transaction summary', error instanceof Error ? { message: error.message } : undefined);
    }
  }

  /**
   * Private helper to update user balances
   */
  private async updateUserBalances(
    farmer: UserEntity,
    buyer: UserEntity,
    farmerEarning: number,
    totalAmount: number,
    tx?: import('sequelize').Transaction
  ): Promise<void> {
    try {
      // Ensure numeric conversion to prevent string concatenation issues
      const currentFarmerBalance = Number(farmer.balance || 0);
      const currentBuyerBalance = Number(buyer.balance || 0);
      
      const newFarmerBalance = currentFarmerBalance + Number(farmerEarning);
      const newBuyerBalance = currentBuyerBalance + Number(totalAmount);
      
      // Round to 2 decimal places to prevent floating point precision issues
      const updatedFarmer = new UserEntity({ 
        ...farmer, 
        balance: Math.round(newFarmerBalance * 100) / 100 
      });
      await this.userRepository.update(farmer.id!, updatedFarmer, tx ? { tx } : undefined);
      
      const updatedBuyer = new UserEntity({ 
        ...buyer, 
        balance: Math.round(newBuyerBalance * 100) / 100 
      });
      await this.userRepository.update(buyer.id!, updatedBuyer, tx ? { tx } : undefined);
    } catch (error) {
      throw new DatabaseError('Failed to update user balances', error instanceof Error ? { message: error.message } : undefined);
    }
  }

  async getShopEarnings(shopId: number, period?: { start: Date; end: Date }): Promise<Record<string, unknown>> {
    try {
      console.log('[getShopEarnings] shopId:', shopId);
      if (period) {
        console.log('[getShopEarnings] period:', period);
      }
  const params: Record<string, unknown> = { shopId };
      if (period) {
        params.startDate = period.start;
        params.endDate = period.end;
      }
      console.log('[getShopEarnings] filters:', params);
      const { rows: transactions } = await this.transactionRepository.findByFilters(params);
      console.log('[getShopEarnings] transactions found:', transactions.length);
      const total_sales = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
      const total_commission = transactions.reduce((sum, t) => sum + (t.commission_amount || 0), 0);
      const total_farmer_earnings = transactions.reduce((sum, t) => sum + (t.farmer_earning || 0), 0);
      console.log('[getShopEarnings] totals:', { total_sales, total_commission, total_farmer_earnings });
      return {
        total_transactions: transactions.length,
        total_sales,
        total_commission,
        total_farmer_earnings
      };
    } catch (error) {
      console.error('[getShopEarnings] error:', error);
      throw new DatabaseError('Failed to retrieve shop earnings', error instanceof Error ? { message: error.message } : undefined);
    }
  }

  async getFarmerEarnings(
    farmerId: number,
    shopId?: number,
    period?: { start: Date; end: Date }
  ): Promise<Record<string, unknown>> {
    try {
      const transactions = await this.transactionRepository.findByFarmer(farmerId);
      
      let filteredTransactions = transactions;
      
      if (shopId) {
        filteredTransactions = transactions.filter(t => t.shop_id === shopId);
      }
      
      if (period) {
        filteredTransactions = filteredTransactions.filter(t => 
          t.created_at && t.created_at >= period.start && t.created_at <= period.end
        );
      }
      
      return {
        totalTransactions: filteredTransactions.length,
        totalEarnings: filteredTransactions.reduce((sum, t) => sum + (t.farmer_earning || 0), 0),
        transactions: filteredTransactions
      };
    } catch (error) {
      throw new DatabaseError('Failed to retrieve farmer earnings', error instanceof Error ? { message: error.message } : undefined);
    }
  }
}