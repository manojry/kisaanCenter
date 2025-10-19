import { applyRepaymentFIFO } from './settlementService';
import { User } from '../models/user';
import { ValidationError } from '../shared/utils/errors';

export async function willShopToFarmerWorsenDebt(payment: { shop_id?: number; counterparty_id?: number; amount?: number; force_override?: boolean }) {
  // If not shop->farmer shape or missing fields, treat as not-worsening
  if (!payment || !payment.shop_id || !payment.counterparty_id) return { worsen: false, currentBalance: 0, simulatedNewBalance: 0 };
  if (payment.force_override) return { worsen: false, currentBalance: 0, simulatedNewBalance: 0 };

  const paymentAmount = Number(payment.amount || 0);
  // Run a dry-run FIFO to estimate remaining amount applied to balance
  const fifoPreview = await applyRepaymentFIFO(payment.shop_id, payment.counterparty_id, paymentAmount, undefined, { dryRun: true });
  const remainingForBalance = (fifoPreview as any)?.remaining || 0;

  const farmer = await User.findByPk(payment.counterparty_id);
  const currentBalance = Number(farmer?.balance || 0);
  const simulatedNewBalance = currentBalance - remainingForBalance;

  return { worsen: simulatedNewBalance < currentBalance, currentBalance, simulatedNewBalance, remainingForBalance };
}

export function throwIfWorsens(payment: any) {
  throw new ValidationError('Payment would increase farmer debt. Include force_override=true to proceed if you understand the consequences.', { payment });
}

export default { willShopToFarmerWorsenDebt, throwIfWorsens };
