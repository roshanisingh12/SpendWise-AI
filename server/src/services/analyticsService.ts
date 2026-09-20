import { prisma } from '../config/prisma';
import { Decimal } from '@prisma/client/runtime/library';

function toNum(d: Decimal | null | undefined): number {
  return d ? Number(d) : 0;
}

export async function getSummary(userId: string, year?: number, month?: number) {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;

  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 0, 23, 59, 59, 999);

  const [incomeAgg, expenseAgg, transactionCount, savingsGoals] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: 'INCOME', date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE', date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.count({ where: { userId, date: { gte: startDate, lte: endDate } } }),
    prisma.savingsGoal.findMany({ where: { userId } }),
  ]);

  const totalIncome = toNum(incomeAgg._sum.amount);
  const totalExpenses = toNum(expenseAgg._sum.amount);
  const balance = totalIncome - totalExpenses;
  const totalSaved = savingsGoals.reduce((sum, g) => sum + toNum(g.currentAmount), 0);

  return {
    period: { year: y, month: m },
    totalIncome,
    totalExpenses,
    balance,
    transactionCount,
    totalSaved,
    savingsGoalCount: savingsGoals.length,
  };
}

export async function getMonthlyAnalytics(userId: string, months = 6) {
  // Clamp months to 1–24 for safety
  const safeMonths = Math.max(1, Math.min(24, months));
  const now = new Date();

  // Build all month bounds up-front
  const monthRanges = Array.from({ length: safeMonths }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (safeMonths - 1 - i), 1);
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    return {
      label: date.toLocaleString('en-US', { month: 'short' }),
      year: y,
      monthNum: m,
      startDate: new Date(y, m - 1, 1),
      endDate: new Date(y, m, 0, 23, 59, 59, 999),
    };
  });

  // Fetch all months in parallel
  const results = await Promise.all(
    monthRanges.map(async ({ label, year, monthNum, startDate, endDate }) => {
      const [incomeAgg, expenseAgg] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId, type: 'INCOME', date: { gte: startDate, lte: endDate } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId, type: 'EXPENSE', date: { gte: startDate, lte: endDate } },
          _sum: { amount: true },
        }),
      ]);

      const income = toNum(incomeAgg._sum.amount);
      const expenses = toNum(expenseAgg._sum.amount);
      return { month: label, year, monthNum, income, expenses, balance: income - expenses };
    })
  );

  return results;
}


export async function getCategoryAnalytics(userId: string, startDate?: string, endDate?: string) {
  const where: Record<string, unknown> = { userId, type: 'EXPENSE' };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) (where.date as Record<string, Date>).gte = new Date(startDate);
    if (endDate) (where.date as Record<string, Date>).lte = new Date(endDate);
  }

  const grouped = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where,
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: 'desc' } },
  });

  // Enrich with category names
  const categoryIds = grouped.map((g) => g.categoryId).filter(Boolean) as string[];
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, color: true, icon: true },
  });
  const catMap = new Map(categories.map((c) => [c.id, c]));

  const totalExpenses = grouped.reduce((sum, g) => sum + toNum(g._sum.amount), 0);

  return grouped.map((g) => {
    const amount = toNum(g._sum.amount);
    const category = g.categoryId ? catMap.get(g.categoryId) : null;
    return {
      categoryId: g.categoryId,
      categoryName: category?.name ?? 'Uncategorized',
      color: category?.color ?? null,
      icon: category?.icon ?? null,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100 * 10) / 10 : 0,
      count: g._count,
    };
  });
}

export async function getBudgetProgress(userId: string) {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    include: { category: { select: { id: true, name: true, color: true, icon: true } } },
  });

  const results = await Promise.all(
    budgets.map(async (budget) => {
      // Calculate actual spending from transactions for this budget's period/category
      const where: Record<string, unknown> = {
        userId,
        type: 'EXPENSE',
        date: {
          gte: budget.startDate,
          ...(budget.endDate && { lte: budget.endDate }),
        },
      };
      if (budget.categoryId) where.categoryId = budget.categoryId;

      const spendingAgg = await prisma.transaction.aggregate({
        where,
        _sum: { amount: true },
      });

      const actualSpent = toNum(spendingAgg._sum.amount);
      const budgetAmount = toNum(budget.amount);
      const percentage = budgetAmount > 0 ? Math.round((actualSpent / budgetAmount) * 100) : 0;

      return {
        id: budget.id,
        categoryId: budget.categoryId,
        categoryName: budget.category?.name ?? 'Overall',
        color: budget.category?.color ?? null,
        icon: budget.category?.icon ?? null,
        budgetAmount,
        actualSpent,
        remaining: budgetAmount - actualSpent,
        percentage,
        period: budget.period,
        startDate: budget.startDate,
        endDate: budget.endDate,
        isOverBudget: actualSpent > budgetAmount,
      };
    })
  );

  return results;
}

export async function getSavingsProgress(userId: string) {
  const goals = await prisma.savingsGoal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return goals.map((goal) => {
    const target = toNum(goal.targetAmount);
    const current = toNum(goal.currentAmount);
    const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
    return {
      id: goal.id,
      name: goal.name,
      targetAmount: target,
      currentAmount: current,
      remaining: target - current,
      percentage,
      targetDate: goal.targetDate,
      isCompleted: current >= target,
    };
  });
}
