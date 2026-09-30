-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredCurrency" TEXT NOT NULL DEFAULT 'INR';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "currencyCode" TEXT NOT NULL DEFAULT 'INR';

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN IF NOT EXISTS "currencyCode" TEXT NOT NULL DEFAULT 'INR';

-- AlterTable
ALTER TABLE "SavingsGoal" ADD COLUMN IF NOT EXISTS "currencyCode" TEXT NOT NULL DEFAULT 'INR';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Transaction_userId_currencyCode_idx" ON "Transaction"("userId", "currencyCode");
