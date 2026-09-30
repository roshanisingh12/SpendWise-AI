import { TransactionInput } from '../schemas/validation';
import * as repo from '../repositories/transactionRepository';
import * as categoryRepo from '../repositories/categoryRepository';
import { AppError } from '../middleware/errorHandler';
import { getPaginationParams } from '../utils/response';

interface ListOptions {
  page?: string;
  limit?: string;
  type?: string;
  categoryId?: string;
  currencyCode?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export async function listTransactions(userId: string, query: ListOptions) {
  const { page, limit, skip } = getPaginationParams(query as Record<string, unknown>);
  const type = query.type as 'INCOME' | 'EXPENSE' | undefined;
  const { data, total } = await repo.listTransactions({
    userId,
    page,
    limit,
    skip,
    type: type && ['INCOME', 'EXPENSE'].includes(type) ? type : undefined,
    categoryId: query.categoryId,
    currencyCode: query.currencyCode?.trim().toUpperCase(),
    startDate: query.startDate,
    endDate: query.endDate,
    search: query.search?.trim(),
  });
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getTransaction(id: string, userId: string) {
  const transaction = await repo.findTransactionById(id, userId);
  if (!transaction) throw new AppError('Transaction not found.', 404);
  return transaction;
}

export async function createTransaction(userId: string, data: TransactionInput) {
  if (data.categoryId) {
    const category = await categoryRepo.findCategoryById(data.categoryId, userId);
    if (!category) {
      throw new AppError('Invalid category: category does not exist or does not belong to user.', 400);
    }
  }
  return repo.createTransaction(userId, data);
}

export async function updateTransaction(id: string, userId: string, data: Partial<TransactionInput>) {
  const existing = await repo.findTransactionById(id, userId);
  if (!existing) throw new AppError('Transaction not found.', 404);

  if (data.categoryId) {
    const category = await categoryRepo.findCategoryById(data.categoryId, userId);
    if (!category) {
      throw new AppError('Invalid category: category does not exist or does not belong to user.', 400);
    }
  }

  return repo.updateTransaction(id, userId, data);
}

export async function deleteTransaction(id: string, userId: string) {
  const existing = await repo.findTransactionById(id, userId);
  if (!existing) throw new AppError('Transaction not found.', 404);
  return repo.deleteTransaction(id);
}

