import { SavingsGoalInput } from '../schemas/validation';
import * as repo from '../repositories/savingsGoalRepository';
import { AppError } from '../middleware/errorHandler';

export async function listSavingsGoals(userId: string) {
  return repo.listSavingsGoals(userId);
}

export async function getSavingsGoal(id: string, userId: string) {
  const goal = await repo.findSavingsGoalById(id, userId);
  if (!goal) throw new AppError('Savings goal not found.', 404);
  return goal;
}

export async function createSavingsGoal(userId: string, data: SavingsGoalInput) {
  return repo.createSavingsGoal(userId, data);
}

export async function updateSavingsGoal(id: string, userId: string, data: Partial<SavingsGoalInput>) {
  const existing = await repo.findSavingsGoalById(id, userId);
  if (!existing) throw new AppError('Savings goal not found.', 404);
  return repo.updateSavingsGoal(id, data);
}

export async function deleteSavingsGoal(id: string, userId: string) {
  const existing = await repo.findSavingsGoalById(id, userId);
  if (!existing) throw new AppError('Savings goal not found.', 404);
  return repo.deleteSavingsGoal(id);
}
