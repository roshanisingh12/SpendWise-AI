import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import * as savingsGoalService from '../services/savingsGoalService';
import { savingsGoalSchema, updateSavingsGoalSchema } from '../schemas/validation';
import { sendSuccess } from '../utils/response';

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const goals = await savingsGoalService.listSavingsGoals(req.user!.id);
    sendSuccess(res, { goals });
  } catch (error) {
    next(error);
  }
}

export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const goal = await savingsGoalService.getSavingsGoal(req.params.id as string, req.user!.id);
    sendSuccess(res, { goal });
  } catch (error) {
    next(error);
  }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = savingsGoalSchema.parse(req.body);
    const goal = await savingsGoalService.createSavingsGoal(req.user!.id, data);
    sendSuccess(res, { goal }, 'Savings goal created.', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateSavingsGoalSchema.parse(req.body);
    const goal = await savingsGoalService.updateSavingsGoal(req.params.id as string, req.user!.id, data);
    sendSuccess(res, { goal }, 'Savings goal updated.');
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await savingsGoalService.deleteSavingsGoal(req.params.id as string, req.user!.id);
    sendSuccess(res, null, 'Savings goal deleted.');
  } catch (error) {
    next(error);
  }
}
