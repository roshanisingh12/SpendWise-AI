import { TransactionInput } from '../schemas/validation';
import * as repo from '../repositories/transactionRepository';
import { AppError } from '../middleware/errorHandler';
import { getPaginationParams } from '../utils/response';

interface ListOptions {
  page?: string;
  limit?: string;
  type?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}

export async function listTransactions(userId: string, query: ListOptions) {
  const { page, limit, skip } = getPaginationParams(query as Record<string, unknown>);
  const type = query.type as 'INCOME' | 'EXPENSE' | undefined;
  const { data, total } = await repo.listTransactions({
    userId, page, limit, skip,
    type: type && ['INCOME', 'EXPENSE'].includes(type) ? type : undefined,
    categoryId: query.categoryId,
    startDate: query.startDate,
    endDate: query.endDate,
  });
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getTransaction(id: string, userId: string) {
  const transaction = await repo.findTransactionById(id, userId);
  if (!transaction) throw new AppError('Transaction not found.', 404);
  // Ownership already enforced by repository query (where userId)
  return transaction;
}

export async function createTransaction(userId: string, data: TransactionInput) {
  return repo.createTransaction(userId, data);
}

export async function updateTransaction(id: string, userId: string, data: Partial<TransactionInput>) {
  const existing = await repo.findTransactionById(id, userId);
  if (!existing) throw new AppError('Transaction not found.', 404);
  return repo.updateTransaction(id, userId, data);
}

export async function deleteTransaction(id: string, userId: string) {
  const existing = await repo.findTransactionById(id, userId);
  if (!existing) throw new AppError('Transaction not found.', 404);
  return repo.deleteTransaction(id);
}
