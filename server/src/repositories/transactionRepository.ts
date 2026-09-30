import { prisma } from '../config/prisma';
import { TransactionInput } from '../schemas/validation';
import { Prisma } from '@prisma/client';

interface ListTransactionsOptions {
  userId: string;
  page: number;
  limit: number;
  skip: number;
  type?: 'INCOME' | 'EXPENSE';
  categoryId?: string;
  currencyCode?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export async function listTransactions(opts: ListTransactionsOptions) {
  const where: Prisma.TransactionWhereInput = { userId: opts.userId };

  if (opts.type) where.type = opts.type;
  if (opts.categoryId) where.categoryId = opts.categoryId;
  if (opts.currencyCode) where.currencyCode = opts.currencyCode;
  if (opts.startDate || opts.endDate) {
    where.date = {};
    if (opts.startDate) (where.date as Prisma.DateTimeFilter).gte = new Date(opts.startDate);
    if (opts.endDate) (where.date as Prisma.DateTimeFilter).lte = new Date(opts.endDate);
  }
  if (opts.search) {
    where.description = { contains: opts.search, mode: 'insensitive' };
  }

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: { select: { id: true, name: true, type: true, icon: true, color: true } } },
      orderBy: { date: 'desc' },
      skip: opts.skip,
      take: opts.limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { data, total };
}

export async function findTransactionById(id: string, userId: string) {
  return prisma.transaction.findFirst({
    where: { id, userId },
    include: { category: { select: { id: true, name: true, type: true, icon: true, color: true } } },
  });
}

export async function createTransaction(userId: string, data: TransactionInput) {
  return prisma.transaction.create({
    data: {
      userId,
      type: data.type,
      amount: data.amount,
      currencyCode: data.currencyCode || 'INR',
      categoryId: data.categoryId ?? null,
      description: data.description ?? null,
      date: new Date(data.date),
    },
    include: { category: { select: { id: true, name: true, type: true, icon: true, color: true } } },
  });
}

export async function updateTransaction(id: string, userId: string, data: Partial<TransactionInput>) {
  return prisma.transaction.update({
    where: { id },
    data: {
      ...(data.type && { type: data.type }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.currencyCode && { currencyCode: data.currencyCode }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.date && { date: new Date(data.date) }),
    },
    include: { category: { select: { id: true, name: true, type: true, icon: true, color: true } } },
  });
}

export async function deleteTransaction(id: string) {
  return prisma.transaction.delete({ where: { id } });
}
