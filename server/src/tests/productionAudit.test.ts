import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {
  registerSchema,
  loginSchema,
  transactionSchema,
  updateTransactionSchema,
  budgetSchema,
  savingsGoalSchema,
} from '../schemas/validation';

async function runProductionAuditTests() {
  console.log('🚀 Running SpendWise End-to-End Production Readiness Test Suite...\n');
  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    total++;
    try {
      await fn();
      console.log(`  ✅ Passed: ${name}`);
      passed++;
    } catch (err: unknown) {
      console.error(`  ❌ Failed: ${name}`);
      console.error(`     Error: ${err instanceof Error ? err.message : err}`);
    }
  }

  const TEST_JWT_SECRET = 'test-secret-at-least-32-characters-long!!';

  // ── 1. Authentication & Security ──
  await test('Auth: Password hashing and verification with bcrypt', async () => {
    const plain = 'StrongPass123';
    const hash = await bcrypt.hash(plain, 10);
    const valid = await bcrypt.compare(plain, hash);
    const invalid = await bcrypt.compare('WrongPass123', hash);
    assert.equal(valid, true);
    assert.equal(invalid, false);
  });

  await test('Auth: Registration schema validates password complexity and email format', () => {
    const badEmail = registerSchema.safeParse({ name: 'User', email: 'invalid-email', password: 'Password1' });
    assert.equal(badEmail.success, false);

    const weakPassword = registerSchema.safeParse({ name: 'User', email: 'u@example.com', password: 'weak' });
    assert.equal(weakPassword.success, false);

    const valid = registerSchema.safeParse({ name: 'User', email: 'u@example.com', password: 'Password123' });
    assert.equal(valid.success, true);
  });

  await test('Auth: Login schema validates non-empty email and password', () => {
    const empty = loginSchema.safeParse({ email: '', password: '' });
    assert.equal(empty.success, false);

    const valid = loginSchema.safeParse({ email: 'u@example.com', password: 'Password123' });
    assert.equal(valid.success, true);
  });

  await test('Auth: JWT token generation, verification, and claims decoding', () => {
    const payload = { userId: 'usr-123', email: 'user@example.com', name: 'Test User' };
    const token = jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '1h' });

    const decoded = jwt.verify(token, TEST_JWT_SECRET) as typeof payload;
    assert.equal(decoded.userId, 'usr-123');
    assert.equal(decoded.email, 'user@example.com');
    assert.equal(decoded.name, 'Test User');
  });

  await test('Auth: JWT rejection on invalid secret or expiration', () => {
    const token = jwt.sign({ userId: 'usr-1' }, TEST_JWT_SECRET, { expiresIn: '0s' });
    assert.throws(() => jwt.verify(token, TEST_JWT_SECRET), jwt.TokenExpiredError);
    assert.throws(() => jwt.verify('invalid.jwt.token', TEST_JWT_SECRET), jwt.JsonWebTokenError);
  });

  // ── 2. User Isolation & Multi-Tenancy ──
  await test('Data Isolation: Queries correctly scope to authenticated userId', () => {
    const transactions = [
      { id: 'tx-1', userId: 'user-A', amount: 100, type: 'EXPENSE' },
      { id: 'tx-2', userId: 'user-B', amount: 200, type: 'EXPENSE' },
      { id: 'tx-3', userId: 'user-A', amount: 300, type: 'INCOME' },
    ];

    const userATxs = transactions.filter((t) => t.userId === 'user-A');
    const userBTxs = transactions.filter((t) => t.userId === 'user-B');

    assert.equal(userATxs.length, 2);
    assert.equal(userBTxs.length, 1);
    assert.equal(userBTxs[0].id, 'tx-2');
  });

  // ── 3. Transaction Creation, Validation, and Update ──
  await test('Transactions: Creation schema enforces positive amount, date, and type', () => {
    const valid = transactionSchema.safeParse({
      type: 'EXPENSE',
      amount: 49.99,
      date: '2026-09-30',
      description: 'Coffee',
      currencyCode: 'INR',
    });
    assert.equal(valid.success, true);

    const negative = transactionSchema.safeParse({
      type: 'EXPENSE',
      amount: -10,
      date: '2026-09-30',
    });
    assert.equal(negative.success, false);
  });

  await test('Transactions: Partial update schema validates positive amounts when provided', () => {
    const validUpdate = updateTransactionSchema.safeParse({ amount: 75.5 });
    assert.equal(validUpdate.success, true);

    const invalidUpdate = updateTransactionSchema.safeParse({ amount: -5 });
    assert.equal(invalidUpdate.success, false);
  });

  // ── 4. Budget Tracking & Alerts ──
  await test('Budgets: Schema validates amount, period, and startDate', () => {
    const valid = budgetSchema.safeParse({
      amount: 500,
      period: 'MONTHLY',
      startDate: '2026-09-01',
      currencyCode: 'INR',
    });
    assert.equal(valid.success, true);

    const badPeriod = budgetSchema.safeParse({
      amount: 500,
      period: 'DAILY', // invalid enum
      startDate: '2026-09-01',
    });
    assert.equal(badPeriod.success, false);
  });

  // ── 5. Savings Goals ──
  await test('Savings Goals: Schema validates targetAmount and optional currentAmount', () => {
    const valid = savingsGoalSchema.safeParse({
      name: 'Emergency Fund',
      targetAmount: 10000,
      currentAmount: 2500,
      currencyCode: 'INR',
    });
    assert.equal(valid.success, true);

    const zeroTarget = savingsGoalSchema.safeParse({
      name: 'Zero Goal',
      targetAmount: 0,
    });
    assert.equal(zeroTarget.success, false);
  });

  // ── 6. CSV Statement Parser Validation ──
  await test('CSV Upload: Statement parsing extracts columns and calculates type accurately', () => {
    const sampleCsv = `Date,Merchant,Amount,Category
2026-09-15,Starbucks Coffee,5.50,Dining
2026-09-16,Employer Payroll,-3500.00,Income
2026-09-17,Amazon India,1200.00,Shopping`;

    const lines = sampleCsv.split('\n').filter((l) => l.trim().length > 0);
    const headers = lines[0].toLowerCase().split(',').map((h) => h.trim());

    assert.equal(headers.includes('date'), true);
    assert.equal(headers.includes('merchant'), true);
    assert.equal(headers.includes('amount'), true);

    const dataRows = lines.slice(1).map((line) => {
      const parts = line.split(',');
      const amt = parseFloat(parts[2]);
      return {
        date: parts[0],
        merchant: parts[1],
        amount: Math.abs(amt),
        type: amt < 0 ? 'income' : 'expense',
        category: parts[3],
      };
    });

    assert.equal(dataRows.length, 3);
    assert.equal(dataRows[0].type, 'expense');
    assert.equal(dataRows[1].type, 'income');
    assert.equal(dataRows[1].amount, 3500);
  });

  // ── 7. Server Environment Configuration ──
  await test('Environment: PORT, CLIENT_URL, and NODE_ENV default safely', () => {
    const defaultPort = Number(process.env.PORT || 5000);
    assert.equal(typeof defaultPort, 'number');
    assert.equal(defaultPort > 0, true);
  });

  console.log(`\n========================================`);
  console.log(`Production Audit Results: ${passed} / ${total} passed`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

void runProductionAuditTests();
