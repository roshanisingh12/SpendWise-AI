import { prisma } from '../config/prisma';
import { SavingsGoalInput } from '../schemas/validation';

export async function listSavingsGoals(userId: string) {
  return prisma.savingsGoal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findSavingsGoalById(id: string, userId: string) {
  return prisma.savingsGoal.findFirst({ where: { id, userId } });
}

export async function createSavingsGoal(userId: string, data: SavingsGoalInput) {
  return prisma.savingsGoal.create({
    data: {
      userId,
      name: data.name,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount ?? 0,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
    },
  });
}

export async function updateSavingsGoal(id: string, data: Partial<SavingsGoalInput>) {
  return prisma.savingsGoal.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
      ...(data.currentAmount !== undefined && { currentAmount: data.currentAmount }),
      ...(data.targetDate !== undefined && { targetDate: data.targetDate ? new Date(data.targetDate) : null }),
    },
  });
}

export async function deleteSavingsGoal(id: string) {
  return prisma.savingsGoal.delete({ where: { id } });
}
