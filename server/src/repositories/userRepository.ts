import { prisma } from '../config/prisma';
import { RegisterInput, UpdateUserInput } from '../schemas/validation';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// Safe user selector - never returns passwordHash
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  preferredCurrency: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: safeUserSelect,
  });
}

export async function createUser(data: RegisterInput) {
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      preferredCurrency: data.preferredCurrency || 'INR',
    },
    select: safeUserSelect,
  });
}

export async function updateUser(id: string, data: UpdateUserInput) {
  return prisma.user.update({
    where: { id },
    data,
    select: safeUserSelect,
  });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}
