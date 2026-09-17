import * as repo from '../repositories/insightRepository';
import { AppError } from '../middleware/errorHandler';

export async function listInsights(userId: string) {
  return repo.listInsights(userId);
}

export async function getInsight(id: string, userId: string) {
  const insight = await repo.findInsightById(id, userId);
  if (!insight) throw new AppError('Insight not found.', 404);
  return insight;
}

export async function deleteInsight(id: string, userId: string) {
  const insight = await repo.findInsightById(id, userId);
  if (!insight) throw new AppError('Insight not found.', 404);
  return repo.deleteInsight(id);
}
