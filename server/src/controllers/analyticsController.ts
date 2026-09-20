import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import * as analyticsService from '../services/analyticsService';
import { sendSuccess, sendError } from '../utils/response';

export async function summary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawYear = req.query.year ? parseInt(String(req.query.year), 10) : undefined;
    const rawMonth = req.query.month ? parseInt(String(req.query.month), 10) : undefined;

    // Validate year range if provided
    if (rawYear !== undefined && (isNaN(rawYear) || rawYear < 2000 || rawYear > 2100)) {
      sendError(res, 'Invalid year. Must be between 2000 and 2100.', 400);
      return;
    }
    // Validate month range if provided
    if (rawMonth !== undefined && (isNaN(rawMonth) || rawMonth < 1 || rawMonth > 12)) {
      sendError(res, 'Invalid month. Must be between 1 and 12.', 400);
      return;
    }

    const result = await analyticsService.getSummary(req.user!.id, rawYear, rawMonth);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function monthly(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawMonths = req.query.months ? parseInt(String(req.query.months), 10) : 6;
    // Clamp to 1–24 months to prevent unbounded loops
    const months = isNaN(rawMonths) ? 6 : Math.max(1, Math.min(24, rawMonths));
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

