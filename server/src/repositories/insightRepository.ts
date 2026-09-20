import { prisma } from '../config/prisma';

const MAX_INSIGHTS = 50;

export async function listInsights(userId: string, limit = MAX_INSIGHTS) {
  const safeLimit = Math.min(limit, MAX_INSIGHTS);
  return prisma.financialInsight.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: safeLimit,
  });
}

export async function findInsightById(id: string, userId: string) {
  return prisma.financialInsight.findFirst({ where: { id, userId } });
}

export async function deleteInsight(id: string) {
  return prisma.financialInsight.delete({ where: { id } });
}
