import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import * as transactionService from '../services/transactionService';
import { transactionSchema, updateTransactionSchema, bulkTransactionSchema } from '../schemas/validation';
import { sendSuccess } from '../utils/response';

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await transactionService.listTransactions(req.user!.id, req.query as Record<string, string>);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const transaction = await transactionService.getTransaction(req.params.id as string, req.user!.id);
    sendSuccess(res, { transaction });
  } catch (error) {
    next(error);
  }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = transactionSchema.parse(req.body);
    const transaction = await transactionService.createTransaction(req.user!.id, data);
    sendSuccess(res, { transaction }, 'Transaction created.', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateTransactionSchema.parse(req.body);
    const transaction = await transactionService.updateTransaction(req.params.id as string, req.user!.id, data);
    sendSuccess(res, { transaction }, 'Transaction updated.');
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await transactionService.deleteTransaction(req.params.id as string, req.user!.id);
    sendSuccess(res, null, 'Transaction deleted.');
  } catch (error) {
    next(error);
  }
}

export async function bulkCreate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { transactions } = bulkTransactionSchema.parse(req.body);
    const result = await transactionService.bulkCreateTransactions(req.user!.id, transactions);
    sendSuccess(res, { count: result.count }, `${result.count} transactions imported.`, 201);
  } catch (error) {
    next(error);
  }
}
