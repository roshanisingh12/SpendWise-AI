import { UpdateUserInput } from '../schemas/validation';
import * as userRepo from '../repositories/userRepository';
import { AppError } from '../middleware/errorHandler';

export async function getUserProfile(userId: string) {
  const user = await userRepo.findUserById(userId);
  if (!user) throw new AppError('User not found.', 404);
  return user;
}

export async function updateUserProfile(userId: string, data: UpdateUserInput) {
  const existing = await userRepo.findUserById(userId);
  if (!existing) throw new AppError('User not found.', 404);

  // If updating email, check it isn't taken by another user
  if (data.email && data.email !== existing.email) {
    const emailTaken = await userRepo.findUserByEmail(data.email);
    if (emailTaken) throw new AppError('This email is already in use.', 409);
  }

  return userRepo.updateUser(userId, data);
}

export async function deleteUserAccount(userId: string) {
  const existing = await userRepo.findUserById(userId);
  if (!existing) throw new AppError('User not found.', 404);
  await userRepo.deleteUser(userId);
}
