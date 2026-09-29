import { prisma } from '../config/prisma';
import { Decimal } from '@prisma/client/runtime/library';

function toNum(d: Decimal | null | undefined): number {
  return d ? Number(d) : 0;
}

export interface FinancialContext {
  user: {
    name: string;
  };
  currentPeriod: {
    monthName: string;
    year: number;
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    savingsRate: number;
    transactionCount: number;
  };
  previousPeriod: {
    monthName: string;
    year: number;
    totalExpenses: number;
    totalIncome: number;
    expenseDiff: number;
    expenseDiffPercent: number;
  };
  last7Days: {
    totalExpenses: number;
    transactionCount: number;
  };
  topCategories: Array<{
    name: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
  largestExpenses: Array<{
    description: string;
    category: string;
    amount: number;
    date: string;
  }>;
  recentTransactions: Array<{
    id: string;
    date: string;
    description: string;
    category: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
  }>;
  budgets: Array<{
    categoryName: string;
    budgetAmount: number;
    actualSpent: number;
    remaining: number;
    percentage: number;
    isOverBudget: boolean;
    period: string;
  }>;
  savingsGoals: Array<{
    name: string;
    targetAmount: number;
    currentAmount: number;
    remaining: number;
    percentage: number;
    targetDate: string | null;
    isCompleted: boolean;
  }>;
  totalSavedInGoals: number;
  categoryIncreases: Array<{
    name: string;
    currentAmount: number;
    prevAmount: number;
    diff: number;
    diffPercent: number;
  }>;
  matchedSpecificCategory?: {
    name: string;
    amount: number;
    percentage: number;
    transactions: Array<{
      description: string;
      amount: number;
      date: string;
    }>;
  };
}

export async function getUserFinancialContext(
  userId: string,
  userMessage?: string,
  userName = 'User'
): Promise<FinancialContext> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Current month bounds
  const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
  const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

  // Previous month bounds
  const startOfPrevMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfPrevMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

  // Last 7 days bounds
  const startOfLast7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Parallel database fetches for optimal speed and zero redundant roundtrips
  const [
    curIncomeAgg,
    curExpenseAgg,
    curTxCount,
    prevIncomeAgg,
    prevExpenseAgg,
    last7DaysAgg,
    last7DaysCount,
    rawCategories,
    rawBudgets,
    rawSavingsGoals,
    recentRawTransactions,
    largestRawExpenses,
  ] = await Promise.all([
    // Current month income
    prisma.transaction.aggregate({
      where: { userId, type: 'INCOME', date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth } },
      _sum: { amount: true },
    }),
    // Current month expense
    prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE', date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth } },
      _sum: { amount: true },
    }),
    // Current month count
    prisma.transaction.count({
      where: { userId, date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth } },
    }),
    // Previous month income
    prisma.transaction.aggregate({
      where: { userId, type: 'INCOME', date: { gte: startOfPrevMonth, lte: endOfPrevMonth } },
      _sum: { amount: true },
    }),
    // Previous month expense
    prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE', date: { gte: startOfPrevMonth, lte: endOfPrevMonth } },
      _sum: { amount: true },
    }),
    // Last 7 days expense
    prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE', date: { gte: startOfLast7Days } },
      _sum: { amount: true },
    }),
    // Last 7 days count
    prisma.transaction.count({
      where: { userId, type: 'EXPENSE', date: { gte: startOfLast7Days } },
    }),
    // Categories for user
    prisma.category.findMany({
      where: { userId },
      select: { id: true, name: true },
    }),
    // Budgets
    prisma.budget.findMany({
      where: { userId },
      include: { category: { select: { id: true, name: true } } },
    }),
    // Savings Goals
    prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
    // Recent 15 transactions
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 15,
      include: { category: { select: { name: true } } },
    }),
    // Top 5 largest expenses (all time or current month)
    prisma.transaction.findMany({
      where: { userId, type: 'EXPENSE' },
      orderBy: { amount: 'desc' },
      take: 5,
      include: { category: { select: { name: true } } },
    }),
  ]);

  const totalIncome = toNum(curIncomeAgg._sum.amount);
  const totalExpenses = toNum(curExpenseAgg._sum.amount);
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  const prevExpenses = toNum(prevExpenseAgg._sum.amount);
  const prevIncome = toNum(prevIncomeAgg._sum.amount);
  const expenseDiff = totalExpenses - prevExpenses;
  const expenseDiffPercent = prevExpenses > 0 ? Math.round((Math.abs(expenseDiff) / prevExpenses) * 100) : 0;

  // Category spending aggregation for current month (or all-time if current month is 0)
  const categorySpending = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      type: 'EXPENSE',
      date: totalExpenses > 0 ? { gte: startOfCurrentMonth, lte: endOfCurrentMonth } : undefined,
    },
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: 'desc' } },
  });

  // Previous month category spending
  const prevCategorySpending = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      type: 'EXPENSE',
      date: { gte: startOfPrevMonth, lte: endOfPrevMonth },
    },
    _sum: { amount: true },
  });

  const catMap = new Map(rawCategories.map((c) => [c.id, c.name]));
  const effectiveCategoryTotal = categorySpending.reduce((sum, g) => sum + toNum(g._sum.amount), 0);

  const topCategories = categorySpending.map((g) => {
    const amt = toNum(g._sum.amount);
    const name = g.categoryId ? catMap.get(g.categoryId) || 'Uncategorized' : 'Uncategorized';
    return {
      name,
      amount: amt,
      percentage: effectiveCategoryTotal > 0 ? Math.round((amt / effectiveCategoryTotal) * 100 * 10) / 10 : 0,
      count: g._count,
    };
  });

  // Map previous month spending
  const prevCatMap = new Map<string, number>();
  for (const item of prevCategorySpending) {
    const name = item.categoryId ? catMap.get(item.categoryId) || 'Uncategorized' : 'Uncategorized';
    prevCatMap.set(name, toNum(item._sum.amount));
  }

  // Calculate category increases
  const allCategoryNames = new Set([
    ...topCategories.map((c) => c.name),
    ...Array.from(prevCatMap.keys()),
  ]);

  const categoryIncreases: FinancialContext['categoryIncreases'] = [];
  for (const catName of allCategoryNames) {
    const curAmt = topCategories.find((c) => c.name === catName)?.amount || 0;
    const prevAmt = prevCatMap.get(catName) || 0;
    const diff = curAmt - prevAmt;
    const diffPercent = prevAmt > 0 ? Math.round((Math.abs(diff) / prevAmt) * 100) : curAmt > 0 ? 100 : 0;
    categoryIncreases.push({
      name: catName,
      currentAmount: curAmt,
      prevAmount: prevAmt,
      diff,
      diffPercent,
    });
  }
  categoryIncreases.sort((a, b) => b.diff - a.diff);

  // Calculate actual budget spending
  const budgets = await Promise.all(
    rawBudgets.map(async (b) => {
      const spendAgg = await prisma.transaction.aggregate({
        where: {
          userId,
          type: 'EXPENSE',
          date: {
            gte: b.startDate,
            ...(b.endDate && { lte: b.endDate }),
          },
          ...(b.categoryId && { categoryId: b.categoryId }),
        },
        _sum: { amount: true },
      });

      const actualSpent = toNum(spendAgg._sum.amount);
      const budgetAmount = toNum(b.amount);
      const remaining = budgetAmount - actualSpent;
      const percentage = budgetAmount > 0 ? Math.round((actualSpent / budgetAmount) * 100) : 0;

      return {
        categoryName: b.category?.name || 'Overall Budget',
        budgetAmount,
        actualSpent,
        remaining,
        percentage,
        isOverBudget: actualSpent > budgetAmount,
        period: b.period,
      };
    })
  );

  // Process Savings Goals
  let totalSavedInGoals = 0;
  const savingsGoals = rawSavingsGoals.map((g) => {
    const targetAmount = toNum(g.targetAmount);
    const currentAmount = toNum(g.currentAmount);
    totalSavedInGoals += currentAmount;
    const remaining = Math.max(0, targetAmount - currentAmount);
    const percentage = targetAmount > 0 ? Math.round((currentAmount / targetAmount) * 100) : 0;

    return {
      name: g.name,
      targetAmount,
      currentAmount,
      remaining,
      percentage,
      targetDate: g.targetDate ? g.targetDate.toISOString().split('T')[0] : null,
      isCompleted: currentAmount >= targetAmount,
    };
  });

  const recentTransactions = recentRawTransactions.map((t) => ({
    id: t.id,
    date: t.date.toISOString().split('T')[0],
    description: t.description || 'Transaction',
    category: t.category?.name || 'Uncategorized',
    amount: toNum(t.amount),
    type: t.type,
  }));

  const largestExpenses = largestRawExpenses.map((t) => ({
    description: t.description || 'Expense',
    category: t.category?.name || 'Uncategorized',
    amount: toNum(t.amount),
    date: t.date.toISOString().split('T')[0],
  }));

  // Match specific category from user message if query is asking for something like "food", "dining", "transport", etc.
  let matchedSpecificCategory: FinancialContext['matchedSpecificCategory'] = undefined;
  if (userMessage) {
    const lower = userMessage.toLowerCase();
    const matchedCategory = rawCategories.find((c) =>
      lower.includes(c.name.toLowerCase()) ||
      (c.name.toLowerCase() === 'groceries' && (lower.includes('food') || lower.includes('grocery'))) ||
      (c.name.toLowerCase() === 'dining' && (lower.includes('restaurant') || lower.includes('eating out'))) ||
      (c.name.toLowerCase() === 'transport' && (lower.includes('travel') || lower.includes('commute') || lower.includes('gas')))
    );

    if (matchedCategory) {
      const catTxList = await prisma.transaction.findMany({
        where: { userId, categoryId: matchedCategory.id, type: 'EXPENSE' },
        orderBy: { date: 'desc' },
        take: 10,
      });

      const catSum = catTxList.reduce((sum, t) => sum + toNum(t.amount), 0);
      const catPercentage = totalExpenses > 0 ? Math.round((catSum / totalExpenses) * 100 * 10) / 10 : 0;

      matchedSpecificCategory = {
        name: matchedCategory.name,
        amount: catSum,
        percentage: catPercentage,
        transactions: catTxList.map((t) => ({
          description: t.description || 'Expense',
          amount: toNum(t.amount),
          date: t.date.toISOString().split('T')[0],
        })),
      };
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return {
    user: { name: userName },
    currentPeriod: {
      monthName: monthNames[currentMonth],
      year: currentYear,
      totalIncome,
      totalExpenses,
      balance,
      savingsRate,
      transactionCount: curTxCount,
    },
    previousPeriod: {
      monthName: monthNames[(currentMonth + 11) % 12],
      year: currentMonth === 0 ? currentYear - 1 : currentYear,
      totalExpenses: prevExpenses,
      totalIncome: prevIncome,
      expenseDiff,
      expenseDiffPercent,
    },
    last7Days: {
      totalExpenses: toNum(last7DaysAgg._sum.amount),
      transactionCount: last7DaysCount,
    },
    topCategories,
    largestExpenses,
    recentTransactions,
    budgets,
    savingsGoals,
    totalSavedInGoals,
    categoryIncreases,
    matchedSpecificCategory,
  };
}

export function formatFinancialContextForPrompt(ctx: FinancialContext): string {
  const { currentPeriod, previousPeriod, last7Days, topCategories, largestExpenses, budgets, savingsGoals, totalSavedInGoals, categoryIncreases, matchedSpecificCategory } = ctx;

  const topCatsStr = topCategories.length > 0
    ? topCategories.map((c) => `- ${c.name}: $${c.amount.toLocaleString()} (${c.percentage}% of spending, ${c.count} transactions)`).join('\n')
    : 'No expenses recorded in categories yet.';

  const categoryDiffStr = categoryIncreases.length > 0
    ? categoryIncreases
        .map((c) => `- ${c.name}: Current $${c.currentAmount.toLocaleString()} vs Prev $${c.prevAmount.toLocaleString()} (${c.diff >= 0 ? `+$${c.diff.toLocaleString()}` : `-$${Math.abs(c.diff).toLocaleString()}`})`)
        .join('\n')
    : 'No category comparison data available.';

  const largestExpStr = largestExpenses.length > 0
    ? largestExpenses.map((e) => `- $${e.amount.toLocaleString()} on "${e.description}" (${e.category}) on ${e.date}`).join('\n')
    : 'No large expenses recorded.';

  const budgetsStr = budgets.length > 0
    ? budgets.map((b) => `- ${b.categoryName}: Budget $${b.budgetAmount.toLocaleString()} | Spent $${b.actualSpent.toLocaleString()} | Remaining $${b.remaining.toLocaleString()} (${b.percentage}% used)${b.isOverBudget ? ' ⚠️ OVER BUDGET' : ''}`).join('\n')
    : 'No active budgets set.';

  const goalsStr = savingsGoals.length > 0
    ? savingsGoals.map((g) => `- ${g.name}: Target $${g.targetAmount.toLocaleString()} | Saved $${g.currentAmount.toLocaleString()} (${g.percentage}%) | Remaining $${g.remaining.toLocaleString()}${g.targetDate ? ` | Target Date: ${g.targetDate}` : ''}${g.isCompleted ? ' ✅ COMPLETED' : ''}`).join('\n')
    : 'No savings goals set.';

  let specificCatStr = '';
  if (matchedSpecificCategory) {
    specificCatStr = `\nSPECIFIC CATEGORY MATCH (${matchedSpecificCategory.name}):
- Total Spent: $${matchedSpecificCategory.amount.toLocaleString()} (${matchedSpecificCategory.percentage}% of total expenses)
- Recent ${matchedSpecificCategory.name} Transactions:
${matchedSpecificCategory.transactions.map((t) => `  * $${t.amount.toLocaleString()} - ${t.description} on ${t.date}`).join('\n')}\n`;
  }

  return `=== AUTHENTIC USER FINANCIAL DATA (${currentPeriod.monthName} ${currentPeriod.year}) ===
USER: ${ctx.user.name}

CURRENT PERIOD SUMMARY (${currentPeriod.monthName} ${currentPeriod.year}):
- Total Income: $${currentPeriod.totalIncome.toLocaleString()}
- Total Expenses: $${currentPeriod.totalExpenses.toLocaleString()}
- Net Balance / Cash Flow: $${currentPeriod.balance.toLocaleString()}
- Savings Rate: ${currentPeriod.savingsRate}%
- Total Transactions: ${currentPeriod.transactionCount}

PREVIOUS PERIOD COMPARISON (${previousPeriod.monthName} ${previousPeriod.year}):
- Previous Month Expenses: $${previousPeriod.totalExpenses.toLocaleString()}
- Previous Month Income: $${previousPeriod.totalIncome.toLocaleString()}
- Expense Change: ${previousPeriod.expenseDiff >= 0 ? `+$${previousPeriod.expenseDiff.toLocaleString()} (+${previousPeriod.expenseDiffPercent}%)` : `-$${Math.abs(previousPeriod.expenseDiff).toLocaleString()} (-${previousPeriod.expenseDiffPercent}%)`}

CATEGORY MONTH-OVER-MONTH CHANGES:
${categoryDiffStr}

LAST 7 DAYS:
- Spending: $${last7Days.totalExpenses.toLocaleString()} across ${last7Days.transactionCount} transactions

CATEGORY BREAKDOWN:
${topCatsStr}

LARGEST EXPENSES:
${largestExpStr}

BUDGETS STATUS:
${budgetsStr}

SAVINGS GOALS:
${goalsStr}
- Total Saved Across All Goals: $${totalSavedInGoals.toLocaleString()}
${specificCatStr}
===================================================`;
}
