import assert from 'node:assert/strict';
import { transactionSchema, budgetSchema, savingsGoalSchema, registerSchema, loginSchema } from '../schemas/validation';

// Simple in-memory representation of core financial engine logic for automated scenario verification
interface Tx {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  date: string;
}

interface BudgetItem {
  id: string;
  category: string;
  amount: number;
}

function computeFinancialSummary(transactions: Tx[]) {
  const income = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
  return { income, expenses, balance, savingsRate };
}

function computeCategoryBreakdown(transactions: Tx[]) {
  const expenses = transactions.filter((t) => t.type === 'EXPENSE');
  const total = expenses.reduce((s, t) => s + t.amount, 0);
  const map: Record<string, number> = {};
  for (const t of expenses) {
    map[t.category] = (map[t.category] || 0) + t.amount;
  }
  return Object.entries(map).map(([category, amount]) => ({
    category,
    amount,
    percentage: total > 0 ? Math.round((amount / total) * 100 * 10) / 10 : 0,
  }));
}

function evaluateBudgetThresholds(budgets: BudgetItem[], transactions: Tx[], monthPrefix: string) {
  return budgets.map((b) => {
    const spent = transactions
      .filter((t) => t.type === 'EXPENSE' && t.category === b.category && t.date.startsWith(monthPrefix))
      .reduce((s, t) => s + t.amount, 0);
    const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
    const isApproaching = percentage >= 80 && percentage <= 100;
    const isOver = percentage > 100;
    return { category: b.category, budgetAmount: b.amount, spent, remaining: b.amount - spent, percentage, isApproaching, isOver };
  });
}

function filterTransactions(transactions: Tx[], opts: { type?: string; category?: string; startDate?: string; endDate?: string }) {
  return transactions.filter((t) => {
    if (opts.type && opts.type !== 'All' && t.type !== opts.type) return false;
    if (opts.category && opts.category !== 'All' && t.category !== opts.category) return false;
    if (opts.startDate && t.date < opts.startDate) return false;
    if (opts.endDate && t.date > opts.endDate) return false;
    return true;
  });
}

function testRunner() {
  console.log('🚀 Running SpendWise Financial & Schema Automated Test Suite...\n');
  let passed = 0;
  let total = 0;

  function runTest(name: string, fn: () => void) {
    total++;
    try {
      fn();
      console.log(`  ✅ Passed: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ Failed: ${name}`);
      console.error(`     Error: ${err?.message || err}`);
    }
  }

  // Scenario 1: Adding an income transaction updates the correct totals
  runTest('Scenario 1: Adding an income transaction updates income and balance', () => {
    const transactions: Tx[] = [
      { id: '1', type: 'INCOME', amount: 5000, category: 'Income', date: '2026-09-01' },
    ];
    const summary = computeFinancialSummary(transactions);
    assert.equal(summary.income, 5000);
    assert.equal(summary.expenses, 0);
    assert.equal(summary.balance, 5000);
    assert.equal(summary.savingsRate, 100);
  });

  // Scenario 2: Adding an expense transaction updates expenses and balance correctly
  runTest('Scenario 2: Adding an expense updates expenses, balance, and savings rate', () => {
    const transactions: Tx[] = [
      { id: '1', type: 'INCOME', amount: 5000, category: 'Income', date: '2026-09-01' },
      { id: '2', type: 'EXPENSE', amount: 1500, category: 'Housing', date: '2026-09-02' },
      { id: '3', type: 'EXPENSE', amount: 500, category: 'Groceries', date: '2026-09-03' },
    ];
    const summary = computeFinancialSummary(transactions);
    assert.equal(summary.income, 5000);
    assert.equal(summary.expenses, 2000);
    assert.equal(summary.balance, 3000);
    assert.equal(summary.savingsRate, 60);
  });

  // Scenario 3: Editing a transaction recalculates the summaries
  runTest('Scenario 3: Editing a transaction updates totals accurately', () => {
    let transactions: Tx[] = [
      { id: '1', type: 'INCOME', amount: 5000, category: 'Income', date: '2026-09-01' },
      { id: '2', type: 'EXPENSE', amount: 1500, category: 'Housing', date: '2026-09-02' },
    ];
    // Edit transaction #2 from 1500 to 1800
    transactions = transactions.map((t) => (t.id === '2' ? { ...t, amount: 1800 } : t));
    const summary = computeFinancialSummary(transactions);
    assert.equal(summary.expenses, 1800);
    assert.equal(summary.balance, 3200);
    assert.equal(summary.savingsRate, 64);
  });

  // Scenario 4: Deleting a transaction removes its effect from all summaries
  runTest('Scenario 4: Deleting a transaction removes it from totals and summaries', () => {
    let transactions: Tx[] = [
      { id: '1', type: 'INCOME', amount: 5000, category: 'Income', date: '2026-09-01' },
      { id: '2', type: 'EXPENSE', amount: 1000, category: 'Dining', date: '2026-09-02' },
      { id: '3', type: 'EXPENSE', amount: 500, category: 'Groceries', date: '2026-09-03' },
    ];
    // Delete transaction #2
    transactions = transactions.filter((t) => t.id !== '2');
    const summary = computeFinancialSummary(transactions);
    assert.equal(summary.expenses, 500);
    assert.equal(summary.balance, 4500);
    assert.equal(summary.savingsRate, 90);
  });

  // Scenario 5: Category totals match the underlying records
  runTest('Scenario 5: Category breakdown matches sum of underlying transactions', () => {
    const transactions: Tx[] = [
      { id: '1', type: 'EXPENSE', amount: 600, category: 'Dining', date: '2026-09-01' },
      { id: '2', type: 'EXPENSE', amount: 400, category: 'Dining', date: '2026-09-02' },
      { id: '3', type: 'EXPENSE', amount: 1000, category: 'Housing', date: '2026-09-03' },
    ];
    const breakdown = computeCategoryBreakdown(transactions);
    const dining = breakdown.find((b) => b.category === 'Dining');
    const housing = breakdown.find((b) => b.category === 'Housing');
    assert.ok(dining && housing);
    assert.equal(dining.amount, 1000);
    assert.equal(dining.percentage, 50);
    assert.equal(housing.amount, 1000);
    assert.equal(housing.percentage, 50);
  });

  // Scenario 6: Budget alerts trigger at the intended thresholds
  runTest('Scenario 6: Budget alerts trigger approaching (>=80%) and over (>100%) thresholds', () => {
    const budgets: BudgetItem[] = [
      { id: 'b1', category: 'Dining', amount: 500 },
      { id: 'b2', category: 'Groceries', amount: 1000 },
      { id: 'b3', category: 'Transport', amount: 300 },
    ];
    const transactions: Tx[] = [
      { id: '1', type: 'EXPENSE', amount: 450, category: 'Dining', date: '2026-09-05' }, // 90% -> approaching
      { id: '2', type: 'EXPENSE', amount: 1200, category: 'Groceries', date: '2026-09-06' }, // 120% -> over
      { id: '3', type: 'EXPENSE', amount: 100, category: 'Transport', date: '2026-09-07' }, // 33% -> normal
    ];
    const status = evaluateBudgetThresholds(budgets, transactions, '2026-09');
    const dining = status.find((s) => s.category === 'Dining')!;
    const groceries = status.find((s) => s.category === 'Groceries')!;
    const transport = status.find((s) => s.category === 'Transport')!;

    assert.equal(dining.isApproaching, true);
    assert.equal(dining.isOver, false);
    assert.equal(groceries.isOver, true);
    assert.equal(transport.isApproaching, false);
    assert.equal(transport.isOver, false);
  });

  // Scenario 7: Month and date filters return the correct transactions
  runTest('Scenario 7: Date and month filters isolate matching transaction records', () => {
    const transactions: Tx[] = [
      { id: '1', type: 'EXPENSE', amount: 100, category: 'Dining', date: '2026-08-15' },
      { id: '2', type: 'EXPENSE', amount: 200, category: 'Dining', date: '2026-09-01' },
      { id: '3', type: 'EXPENSE', amount: 300, category: 'Housing', date: '2026-09-10' },
      { id: '4', type: 'EXPENSE', amount: 400, category: 'Dining', date: '2026-10-01' },
    ];
    const septDining = filterTransactions(transactions, {
      type: 'EXPENSE',
      category: 'Dining',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
    });
    assert.equal(septDining.length, 1);
    assert.equal(septDining[0].id, '2');
  });

  // Scenario 8: Empty datasets do not cause errors
  runTest('Scenario 8: Empty datasets compute zero totals safely with no NaN or crash', () => {
    const summary = computeFinancialSummary([]);
    assert.equal(summary.income, 0);
    assert.equal(summary.expenses, 0);
    assert.equal(summary.balance, 0);
    assert.equal(summary.savingsRate, 0);
    assert.equal(isNaN(summary.savingsRate), false);

    const breakdown = computeCategoryBreakdown([]);
    assert.equal(breakdown.length, 0);
  });

  // Scenario 9: Invalid amounts and missing required fields are rejected
  runTest('Scenario 9: Zod validation schemas reject negative amounts and malformed data', () => {
    // Negative amount
    const invalidTx = transactionSchema.safeParse({
      type: 'EXPENSE',
      amount: -50,
      date: '2026-09-01',
    });
    assert.equal(invalidTx.success, false);

    // Missing type
    const missingType = transactionSchema.safeParse({
      amount: 100,
      date: '2026-09-01',
    });
    assert.equal(missingType.success, false);

    // Valid transaction
    const validTx = transactionSchema.safeParse({
      type: 'EXPENSE',
      amount: 49.99,
      date: '2026-09-01',
      description: 'Grocery Run',
    });
    assert.equal(validTx.success, true);
  });

  // Scenario 10: Budget schema validation
  runTest('Scenario 10: Budget and Savings Goal schemas validate positive targets', () => {
    const invalidBudget = budgetSchema.safeParse({ amount: -100 });
    assert.equal(invalidBudget.success, false);

    const validBudget = budgetSchema.safeParse({ amount: 500, period: 'MONTHLY' });
    assert.equal(validBudget.success, true);

    const validGoal = savingsGoalSchema.safeParse({ name: 'Emergency Fund', targetAmount: 3000 });
    assert.equal(validGoal.success, true);
  });

  // Scenario 11: Auth validation (register & login password security)
  runTest('Scenario 11: Register schema enforces password complexity (length, uppercase, number)', () => {
    const weakPass = registerSchema.safeParse({
      name: 'Devanshi',
      email: 'test@example.com',
      password: 'password', // Missing number and uppercase
    });
    assert.equal(weakPass.success, false);

    const validUser = registerSchema.safeParse({
      name: 'Devanshi',
      email: 'test@example.com',
      password: 'SpendWise1234',
    });
    assert.equal(validUser.success, true);
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} / ${total} passed`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

testRunner();
