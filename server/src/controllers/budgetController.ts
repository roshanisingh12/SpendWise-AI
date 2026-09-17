import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import * as budgetService from '../services/budgetService';
import { budgetSchema, updateBudgetSchema } from '../schemas/validation';
import { sendSuccess } from '../utils/response';

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const budgets = await budgetService.listBudgets(req.user!.id);
    sendSuccess(res, { budgets });
  } catch (error) {
    next(error);
  }
}

export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const budget = await budgetService.getBudget(req.params.id as string, req.user!.id);
    sendSuccess(res, { budget });
  } catch (error) {
    next(error);
  }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = budgetSchema.parse(req.body);
    const budget = await budgetService.createBudget(req.user!.id, data);
    sendSuccess(res, { budget }, 'Budget created.', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateBudgetSchema.parse(req.body);
    const budget = await budgetService.updateBudget(req.params.id as string, req.user!.id, data);
    sendSuccess(res, { budget }, 'Budget updated.');
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await budgetService.deleteBudget(req.params.id as string, req.user!.id);
    sendSuccess(res, null, 'Budget deleted.');
  } catch (error) {
    next(error);
  }
}
