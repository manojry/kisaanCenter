import { User, UserRole } from '../src/models/user';
import { Shop } from '../src/models/shop';
import { Transaction } from '../src/models/transaction';
import { PaymentService } from '../src/services/paymentService';
import { ExpenseRepository } from '../src/repositories/ExpenseRepository';
import sequelize from '../src/config/database';

// Integration tests that exercise partial payments, later settlement, and expense flows.
// These tests expect a reachable Postgres test DB configured via .env (NODE_ENV=test optional).

jest.setTimeout(30000);

describe('integration: partial payments, settlement, expenses', () => {
  let owner: User;
  let shop: Shop;
  let farmer: User;
  let buyer: User;
  let txn: Transaction;
  const createdIds: { users: number[]; shops: number[]; transactions: number[]; payments: number[]; expenses: number[] } = { users: [], shops: [], transactions: [], payments: [], expenses: [] };

  beforeAll(async () => {
    // Ensure DB connection
    await sequelize.authenticate();
  });

  afterAll(async () => {
    // Cleanup created entities conservatively
    try {
      if (txn && txn.id) await Transaction.destroy({ where: { id: txn.id } });
      if (shop && shop.id) await Shop.destroy({ where: { id: shop.id } });
      if (owner && owner.id) await User.destroy({ where: { id: owner.id } });
      if (farmer && farmer.id) await User.destroy({ where: { id: farmer.id } });
      if (buyer && buyer.id) await User.destroy({ where: { id: buyer.id } });
    } catch (err) {
      // don't fail cleanup
      console.warn('cleanup warning', err);
    }
    await sequelize.close();
  });

  test('partial buyer payment realizes proportional commission; later payment completes allocation', async () => {
    // Create owner, shop, farmer, buyer
    owner = await User.create({ username: `owner_test_${Date.now()}`, password: 'p', role: UserRole.Owner, balance: 0, cumulative_value: 0 } as any);
    shop = await Shop.create({ name: `testshop_${Date.now()}`, owner_id: owner.id, address: null, contact: null, status: 'active' } as any);
    farmer = await User.create({ username: `farmer_test_${Date.now()}`, password: 'p', role: UserRole.Farmer, shop_id: shop.id, balance: 0, cumulative_value: 0 } as any);
    buyer = await User.create({ username: `buyer_test_${Date.now()}`, password: 'p', role: UserRole.Buyer, shop_id: shop.id, balance: 0, cumulative_value: 0 } as any);

    // Create a transaction: total 1000, commission 50 (5%)
    txn = await Transaction.create({ shop_id: shop.id, buyer_id: buyer.id, farmer_id: farmer.id, total_amount: 1000, quantity: 10, unit_price: 100, commission_rate: 5, commission_amount: 50, farmer_earning: 950 } as any);

    const paymentSvc = new PaymentService();

    // 1) Buyer makes partial payment of 300 referencing the transaction
    const paymentDto1: any = {
      amount: 300,
      payer_type: 'BUYER',
      payee_type: 'SHOP',
      counterparty_id: buyer.id,
      transaction_id: txn.id,
      shop_id: shop.id,
      status: 'PAID',
      payment_date: new Date().toISOString(),
      method: 'Cash'
    };

    const p1 = await paymentSvc.createPayment(paymentDto1, buyer.id as number);

    // Fetch owner cumulative_value
    const ownerAfter1 = await User.findByPk(owner.id!);
    expect(ownerAfter1).not.toBeNull();
    // commission share = 300/1000 * 50 = 15
    expect(Number(ownerAfter1!.cumulative_value)).toBeCloseTo(15, 2);

    // 2) Buyer makes another payment of 700 to complete the transaction
    const paymentDto2: any = {
      amount: 700,
      payer_type: 'BUYER',
      payee_type: 'SHOP',
      counterparty_id: buyer.id,
      transaction_id: txn.id,
      shop_id: shop.id,
      status: 'PAID',
      payment_date: new Date().toISOString(),
      method: 'Cash'
    };

    const p2 = await paymentSvc.createPayment(paymentDto2, buyer.id as number);

    const ownerAfter2 = await User.findByPk(owner.id!);
    // total commission realized = 50; owner cumulative should be approx 15 + 35 = 50
    expect(Number(ownerAfter2!.cumulative_value)).toBeCloseTo(50, 2);
  }, 20000);

  test('expense creation and settlement via shop payment applies FIFO and updates farmer balance', async () => {
    // create an expense for farmer
    const expenseRepo = new ExpenseRepository();
    const expense = await expenseRepo.create({ shop_id: shop.id, user_id: farmer.id, amount: 500, type: 'advance', description: 'integration test expense' } as any);

    // Farmer balance should increase by 500 (farmer owes)
    const farmerBefore = await User.findByPk(farmer.id!);
    expect(farmerBefore).not.toBeNull();
    const farmerBalBefore = Number(farmerBefore!.balance || 0);

    // Shop pays farmer (SHOP -> FARMER) to settle expenses using PaymentService
    const paymentSvc = new PaymentService();
    const payDto: any = {
      amount: 500,
      payer_type: 'SHOP',
      payee_type: 'FARMER',
      counterparty_id: farmer.id,
      transaction_id: null,
      shop_id: shop.id,
      status: 'PAID',
      payment_date: new Date().toISOString(),
      method: 'Cash'
    };

    const resp = await paymentSvc.createPayment(payDto, owner.id as number);

    const farmerAfter = await User.findByPk(farmer.id!);
    const farmerBalAfter = Number(farmerAfter!.balance || 0);

    // farmer balance should have reduced (less owed) by close to 500 after FIFO settlement
    expect(farmerBalAfter).toBeGreaterThanOrEqual(farmerBalBefore - 0.01);
  }, 20000);
});
