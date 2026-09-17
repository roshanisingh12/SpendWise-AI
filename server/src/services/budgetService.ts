import { BudgetInput } from '../schemas/validation';
import * as repo from '../repositories/budgetRepository';
import { AppError } from '../middleware/errorHandler';

export async function listBudgets(userId: string) {
  return repo.listBudgets(userId);
}

export async function getBudget(id: string, userId: string) {
  const budget = await repo.findBudgetById(id, userId);
  if (!budget) throw new AppError('Budget not found.', 404);
  return budget;
}

export async function createBudget(userId: string, data: BudgetInput) {
  return repo.createBudget(userId, data);
}

export async function updateBudget(id: string, userId: string, data: Partial<BudgetInput>) {
  const existing = await repo.findBudgetById(id, userId);
  if (!existing) throw new AppError('Budget not found.', 404);
  return repo.updateBudget(id, data);
}

export async function deleteBudget(id: string, userId: string) {
  const existing = await repo.findBudgetById(id, userId);
  if (!existing) throw new AppError('Budget not found.', 404);
  return repo.deleteBudget(id);
}
