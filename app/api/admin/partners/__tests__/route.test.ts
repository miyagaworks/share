// app/api/admin/partners/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PrismaMock } from '@/__tests__/helpers/prisma-mock';

// Prisma をモック
const { createPrismaMock: _createMock } = await vi.importActual<typeof import('@/__tests__/helpers/prisma-mock')>('@/__tests__/helpers/prisma-mock');
vi.mock('@/lib/prisma', async () => {
  const { createPrismaMock } = await vi.importActual<typeof import('@/__tests__/helpers/prisma-mock')>('@/__tests__/helpers/prisma-mock');
  return { prisma: createPrismaMock() };
});

// auth をモック
const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

// isSuperAdmin をモック
vi.mock('@/lib/auth/constants', () => ({
  isSuperAdmin: (email: string | null | undefined) => email === 'admin@sns-share.com',
}));

// countPartnerAccounts をモック
vi.mock('@/lib/partner/accounts', () => ({
  countPartnerAccounts: vi.fn().mockResolvedValue(150),
}));

import { GET, POST } from '@/app/api/admin/partners/route';
import { prisma } from '@/lib/prisma';

const prismaMock = prisma as unknown as PrismaMock;

describe('GET /api/admin/partners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Super Admin のみアクセス可', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: 'user@example.com' },
    });

    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBe('権限がありません');
  });

  it('未認証の場合は403を返す', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('Super Admin でパートナー一覧を返す', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: 'admin@sns-share.com' },
    });

    const mockPartners = [
      {
        id: 'p1',
        name: 'Partner 1',
        brandName: 'Brand 1',
        slug: 'brand1',
        plan: 'basic',
        accountStatus: 'active',
        customDomain: null,
        domainVerified: false,
        maxAccounts: 300,
        createdAt: new Date('2026-01-01'),
        _count: { tenants: 2 },
      },
    ];

    prismaMock.partner.findMany.mockResolvedValueOnce(mockPartners);

    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.partners).toHaveLength(1);
    expect(data.partners[0].name).toBe('Partner 1');
    expect(data.partners[0].totalAccounts).toBe(150);
    expect(data.partners[0].totalTenants).toBe(2);
  });
});

describe('POST /api/admin/partners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('非Super Admin は403', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: 'user@example.com' },
    });

    const req = new Request('http://localhost/api/admin/partners', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('必須フィールドが不足している場合は400', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: 'admin@sns-share.com' },
    });

    const req = new Request('http://localhost/api/admin/partners', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe('必須項目が不足しています');
  });

  it('スラッグ重複の場合は400', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: 'admin@sns-share.com' },
    });

    prismaMock.partner.findUnique.mockResolvedValueOnce({ id: 'existing' });

    const req = new Request('http://localhost/api/admin/partners', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Partner',
        brandName: 'Test Brand',
        slug: 'existing-slug',
        adminEmail: 'admin@test.com',
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe('このスラッグは既に使用されています');
  });

  it('正常にパートナーを作成', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: 'admin@sns-share.com' },
    });

    // slug チェック: 重複なし
    prismaMock.partner.findUnique.mockResolvedValueOnce(null);
    // 管理者ユーザーを検索: 新規
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    // ユーザー作成
    prismaMock.user.create.mockResolvedValueOnce({ id: 'new-user-id', email: 'admin@test.com' });
    // 既存の管理者チェック
    prismaMock.partner.findUnique.mockResolvedValueOnce(null);
    // パートナー作成
    prismaMock.partner.create.mockResolvedValueOnce({ id: 'new-partner-id', name: 'Test Partner' });

    const req = new Request('http://localhost/api/admin/partners', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Partner',
        brandName: 'Test Brand',
        slug: 'test-brand',
        adminEmail: 'admin@test.com',
        plan: 'pro',
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.partner.id).toBe('new-partner-id');
  });
});
