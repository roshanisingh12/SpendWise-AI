import { prisma } from '../config/prisma';
import { BudgetInput } from '../schemas/validation';

export async function listBudgets(userId: string) {
  return prisma.budget.findMany({
    where: { userId },
    include: { category: { select: { id: true, name: true, type: true, icon: true, color: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findBudgetById(id: string, userId: string) {
  return prisma.budget.findFirst({
    where: { id, userId },
    include: { category: { select: { id: true, name: true, type: true, icon: true, color: true } } },
  });
}

export async function createBudget(userId: string, data: BudgetInput) {
  return prisma.budget.create({
    data: {
      userId,
      categoryId: data.categoryId ?? null,
      amount: data.amount,
      period: data.period,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
    include: { category: { select: { id: true, name: true, type: true, icon: true, color: true } } },
  });
}

export async function updateBudget(id: string, data: Partial<BudgetInput>) {
  return prisma.budget.update({
    where: { id },
    data: {
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.period && { period: data.period }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
    },
    include: { category: { select: { id: true, name: true, type: true, icon: true, color: true } } },
  });
}

export async function deleteBudget(id: string) {
  return prisma.budget.delete({ where: { id } });
}
