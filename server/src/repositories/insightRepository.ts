import { prisma } from '../config/prisma';

export async function listInsights(userId: string) {
  return prisma.financialInsight.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findInsightById(id: string, userId: string) {
  return prisma.financialInsight.findFirst({ where: { id, userId } });
}

export async function deleteInsight(id: string) {
  return prisma.financialInsight.delete({ where: { id } });
}
