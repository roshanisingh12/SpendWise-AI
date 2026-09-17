import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import * as insightService from '../services/insightService';
import { sendSuccess } from '../utils/response';

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const insights = await insightService.listInsights(req.user!.id);
    sendSuccess(res, { insights });
  } catch (error) {
    next(error);
  }
}

export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const insight = await insightService.getInsight(req.params.id as string, req.user!.id);
    sendSuccess(res, { insight });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await insightService.deleteInsight(req.params.id as string, req.user!.id);
    sendSuccess(res, null, 'Insight deleted.');
  } catch (error) {
    next(error);
  }
}
