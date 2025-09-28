// CreditAdvance service class-based implementation

import { CreditAdvance } from '../models/creditAdvance';
import { CreateCreditAdvanceSchema, RepayCreditAdvanceSchema } from '../schemas/creditAdvance';
import { z } from 'zod';

export class CreditAdvanceService {
  
  async issueCredit(data: any) {
    const validated = CreateCreditAdvanceSchema.parse(data);
    // Issue date = now, due date = +30 days (temporary business rule)
    const issued = new Date();
    const due = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const credit = await CreditAdvance.create({
      user_id: validated.user_id,
      amount: validated.amount,
      issued_date: issued,
      due_date: due,
      status: 'active',
      repaid_amount: 0,
      shop_id: data.shop_id || 1,
    } as any);
    return credit;
  }

  async repayCredit(data: any) {
    const validated = RepayCreditAdvanceSchema.parse(data);
    const credit = await CreditAdvance.findByPk(validated.credit_id);
    if (!credit) throw new Error('Credit record not found');
    
    // Use increment for atomic update
    await credit.increment('repaid_amount', { by: validated.amount });
    await credit.reload();
    
    // Check if fully repaid
    const totalAmount = Number(credit.amount);
    const newRepaidAmount = Number(credit.repaid_amount);
    
    if (newRepaidAmount >= totalAmount) {
      credit.status = 'repaid';
      await credit.save();
    }
    
    return credit;
  }

  async getAllCredits(shopId?: number) {
    const whereClause = shopId ? { shop_id: shopId } : {};
    return await CreditAdvance.findAll({ where: whereClause });
  }
}

// Export class and instance for compatibility
export const creditAdvanceService = new CreditAdvanceService();

// Export function-style methods for backward compatibility
export const issueCredit = (data: any) => creditAdvanceService.issueCredit(data);
export const repayCredit = (data: any) => creditAdvanceService.repayCredit(data);


