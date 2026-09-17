import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import * as analyticsService from '../services/analyticsService';
import { sendSuccess } from '../utils/response';

export async function summary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const year = req.query.year ? parseInt(String(req.query.year), 10) : undefined;
    const month = req.query.month ? parseInt(String(req.query.month), 10) : undefined;
    const result = await analyticsService.getSummary(req.user!.id, year, month);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function monthly(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const months = req.query.months ? parseInt(String(req.query.months), 10) : 6;
    const result = await analyticsService.getMonthlyAnalytics(req.user!.id, months);
    sendSuccess(res, { months: result });
  } catch (error) {
    next(error);
  }
}

export async function categories(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const result = await analyticsService.getCategoryAnalytics(req.user!.id, startDate, endDate);
    sendSuccess(res, { categories: result });
  } catch (error) {
    next(error);
  }
}

export async function budgetProgress(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await analyticsService.getBudgetProgress(req.user!.id);
    sendSuccess(res, { budgets: result });
  } catch (error) {
    next(error);
  }
}

export async function savingsProgress(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await analyticsService.getSavingsProgress(req.user!.id);
    sendSuccess(res, { goals: result });
  } catch (error) {
    next(error);
  }
}
