import { sequelize } from '../models/index';
import { UserRepository } from '../repositories/UserRepository';
import { TransactionLedgerRepository } from '../repositories/TransactionLedgerRepository';
import { UserEntity } from '../entities/UserEntity';

interface ApplyAdjustmentInput {
  user_id: number;
  amount: number; // positive
  type: 'credit' | 'charge';
  note?: string | null;
}

export class CreditService {
  private userRepo = new UserRepository();
  private ledgerRepo = new TransactionLedgerRepository();

  /**
   * Apply a credit (reduces balance) or charge (increases balance) for a farmer or buyer.
   * Balances are clamped to >= 0; if credit exceeds current balance, only the remaining balance is removed.
   */
  async applyAdjustment(input: ApplyAdjustmentInput, actor?: { id: number; role: string }) {
    if (!input.user_id || input.user_id <= 0) throw new Error('user_id required');
    if (typeof input.amount !== 'number' || input.amount <= 0) throw new Error('amount must be > 0');
    if (!['credit','charge'].includes(input.type)) throw new Error('type must be credit|charge');

    const user = await this.userRepo.findById(input.user_id);
    if (!user) throw new Error('User not found');

    const previous = Number(user.balance || 0);
    let signedDelta = input.type === 'credit' ? -input.amount : input.amount; // credit lowers balance
    let newBalance = previous + signedDelta;
    if (newBalance < 0) {
      // Adjust delta to avoid negative balance
      signedDelta = -previous;
      newBalance = 0;
    }
    // Round to 2 decimals
    newBalance = Math.round(newBalance * 100) / 100;
    signedDelta = Math.round(signedDelta * 100) / 100;

    const updatedUser = new UserEntity({ ...user, balance: newBalance });
    await this.userRepo.update(user.id!, updatedUser);

    const reason_code = input.type === 'credit' ? 'CREDIT_APPLIED' : 'EXPENSE_CHARGE';
    const ledger = await this.ledgerRepo.create({
      transaction_id: null,
      user_id: user.id!,
      role: typeof user.role === 'string' ? user.role : '',
      delta_amount: signedDelta,
      balance_before: previous,
      balance_after: newBalance,
      reason_code
    });

    return {
      user_id: user.id,
      role: user.role,
      previous_balance: previous,
      delta: signedDelta,
      new_balance: newBalance,
      reason_code,
      note: input.note || null,
      actor: actor ? { id: actor.id, role: actor.role } : undefined,
  ledger_entry_id: (typeof ledger === 'object' && ledger && 'id' in ledger ? (ledger as { id: number }).id : undefined)
    };
  }

  async listAdjustments(userId: number): Promise<unknown[]> {
    if (!userId) throw new Error('userId required');
    const [rows]: [unknown[], unknown] = await sequelize.query(
      `SELECT * FROM kisaan_transaction_ledger 
       WHERE user_id = ? AND reason_code IN ('CREDIT_APPLIED','EXPENSE_CHARGE')
       ORDER BY id DESC`, { replacements: [userId] }
    );
    return rows;
  }
}
