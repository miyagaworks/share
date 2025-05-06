// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// globalThisを使用して環境に依存しない方法でシングルトンを実装
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      typeof process !== 'undefined' && process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
