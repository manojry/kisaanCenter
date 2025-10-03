import { Request, Response } from 'express';
import { creditAdvanceService } from '../services/creditAdvanceService';
import { z } from 'zod';
import { CreateCreditAdvanceSchema, RepayCreditAdvanceSchema } from '../schemas/creditAdvance';
import { created, success, failureCode } from '../shared/http/respond';
import { ErrorCodes } from '../shared/errors/errorCodes';

export class CreditAdvanceController {
  async issueCredit(req: Request, res: Response) {
    try {
      const validated = CreateCreditAdvanceSchema.parse(req.body);
      const credit = await creditAdvanceService.issueCredit(validated);
      created(res, credit);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { issues: error.issues }, 'Validation failed');
      }
      failureCode(res, 500, ErrorCodes.ISSUE_CREDIT_FAILED, { error: (error as Error).message }, 'Failed to issue credit');
    }
  }

  async repayCredit(req: Request, res: Response) {
    try {
      const validated = RepayCreditAdvanceSchema.parse(req.body);
      const credit = await creditAdvanceService.repayCredit(validated);
      success(res, credit, { message: 'Credit repaid successfully' });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { issues: error.issues }, 'Validation failed');
      }
      failureCode(res, 500, ErrorCodes.REPAY_CREDIT_FAILED, { error: (error as Error).message }, 'Failed to repay credit');
    }
  }

  async getAllCredits(req: Request, res: Response) {
    try {
      const credits = await creditAdvanceService.getAllCredits();
      success(res, credits, { message: 'Credits retrieved successfully', meta: { count: credits.length } });
    } catch (error: unknown) {
      failureCode(res, 500, ErrorCodes.ISSUE_CREDIT_FAILED, { error: (error as Error).message }, 'Failed to fetch credits');
    }
  }
}
