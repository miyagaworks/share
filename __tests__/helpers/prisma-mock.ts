// __tests__/helpers/prisma-mock.ts
// Prisma モックヘルパー（全テストで共有）
import { vi } from 'vitest';

/**
 * Prisma のモック型定義
 * テストで使用する Prisma メソッドのスタブ
 */
export function createPrismaMock() {
  return {
    partner: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    corporateTenant: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    profile: {
      aggregate: vi.fn(),
      create: vi.fn(),
    },
    partnerActivityLog: {
      create: vi.fn(),
    },
    oneTapSealOrder: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $disconnect: vi.fn(),
  };
}

export type PrismaMock = ReturnType<typeof createPrismaMock>;
