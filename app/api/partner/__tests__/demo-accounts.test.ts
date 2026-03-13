// app/api/partner/__tests__/demo-accounts.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrismaMock, type PrismaMock } from '@/__tests__/helpers/prisma-mock';

const prismaMock = createPrismaMock();
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('GET /api/partner/demo-accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未認証の場合は401', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/partner/demo-accounts/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('パートナーでないユーザーは403', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });
    prismaMock.partner.findUnique.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/partner/demo-accounts/route');
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('デモアカウント一覧を返す', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });
    prismaMock.partner.findUnique.mockResolvedValueOnce({ id: 'partner-1' });
    prismaMock.user.findMany.mockResolvedValueOnce([
      {
        id: 'demo-1',
        name: 'デモ太郎',
        email: 'demo@demo.local',
        createdAt: new Date('2026-01-15'),
        profile: { slug: 'demo-slug-1', views: 42 },
      },
    ]);

    const { GET } = await import('@/app/api/partner/demo-accounts/route');
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.demoAccounts).toHaveLength(1);
    expect(data.demoAccounts[0].name).toBe('デモ太郎');
    expect(data.demoAccounts[0].profileSlug).toBe('demo-slug-1');
    expect(data.demoAccounts[0].profileViews).toBe(42);
  });
});

describe('POST /api/partner/demo-accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未認証の場合は401', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/partner/demo-accounts/route');
    const req = new Request('http://localhost/api/partner/demo-accounts', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Demo' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('名前が空の場合は400', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });
    prismaMock.partner.findUnique.mockResolvedValueOnce({
      id: 'partner-1',
      brandName: 'Test Brand',
      slug: 'test-partner',
      accountStatus: 'active',
    });

    const { POST } = await import('@/app/api/partner/demo-accounts/route');
    const req = new Request('http://localhost/api/partner/demo-accounts', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('デモアカウントを正常に作成する', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });
    prismaMock.partner.findUnique.mockResolvedValueOnce({
      id: 'partner-1',
      brandName: 'Test Brand',
      slug: 'test-partner',
      accountStatus: 'active',
    });
    prismaMock.user.create.mockResolvedValueOnce({
      id: 'demo-user-1',
      name: 'デモ太郎',
      email: 'demo-test-partner-123@demo.local',
    });
    prismaMock.profile.create.mockResolvedValueOnce({
      slug: 'demo-test-partner-123',
    });
    prismaMock.partnerActivityLog.create.mockResolvedValueOnce({});

    const { POST } = await import('@/app/api/partner/demo-accounts/route');
    const req = new Request('http://localhost/api/partner/demo-accounts', {
      method: 'POST',
      body: JSON.stringify({ name: 'デモ太郎' }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.demoAccount.name).toBe('デモ太郎');
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isDemo: true,
          partnerId: 'partner-1',
        }),
      }),
    );
  });

  it('inactiveパートナーは403', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });
    prismaMock.partner.findUnique.mockResolvedValueOnce({
      id: 'partner-1',
      accountStatus: 'suspended',
    });

    const { POST } = await import('@/app/api/partner/demo-accounts/route');
    const req = new Request('http://localhost/api/partner/demo-accounts', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/partner/demo-accounts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未認証の場合は401', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { DELETE } = await import('@/app/api/partner/demo-accounts/[id]/route');
    const req = new Request('http://localhost/api/partner/demo-accounts/demo-1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'demo-1' }) });
    expect(res.status).toBe(401);
  });

  it('存在しないデモアカウントは404', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });
    prismaMock.partner.findUnique.mockResolvedValueOnce({ id: 'partner-1' });
    prismaMock.user.findFirst.mockResolvedValueOnce(null);

    const { DELETE } = await import('@/app/api/partner/demo-accounts/[id]/route');
    const req = new Request('http://localhost/api/partner/demo-accounts/demo-1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'demo-1' }) });
    expect(res.status).toBe(404);
  });

  it('デモアカウントを正常に削除する', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });
    prismaMock.partner.findUnique.mockResolvedValueOnce({ id: 'partner-1' });
    prismaMock.user.findFirst.mockResolvedValueOnce({
      id: 'demo-1',
      name: 'デモ太郎',
    });
    prismaMock.user.delete.mockResolvedValueOnce({});
    prismaMock.partnerActivityLog.create.mockResolvedValueOnce({});

    const { DELETE } = await import('@/app/api/partner/demo-accounts/[id]/route');
    const req = new Request('http://localhost/api/partner/demo-accounts/demo-1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'demo-1' }) });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 'demo-1' } });
  });
});
