// CreditAdvance service stub

import { CreditAdvance } from '../models/creditAdvance';
import { CreditAdvanceSchema, RepayCreditSchema } from '../schemas/creditAdvance';
import { z } from 'zod';

export const issueCredit = async (data: any) => {
  const validated = CreditAdvanceSchema.parse(data);
  const credit = await CreditAdvance.create({
    user_id: parseInt(validated.user_id),
    amount: validated.amount,
    issued_date: new Date(validated.issued_date),
    due_date: new Date(validated.due_date),
    status: 'active' as const,
    repaid_amount: 0,
    shop_id: data.shop_id || 1, // Default shop_id
  });
  return credit;
};

export const repayCredit = async (data: any) => {
  const validated = RepayCreditSchema.parse(data);
  const credit = await CreditAdvance.findByPk(validated.credit_id);
  if (!credit) throw new Error('Credit record not found');
  credit.repaid_amount += validated.amount;
  if (credit.repaid_amount >= credit.amount) {
    credit.status = 'repaid';
  }
  await credit.save();
  return credit;
};


