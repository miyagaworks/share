// app/api/partner/__tests__/routes.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrismaMock, type PrismaMock } from '@/__tests__/helpers/prisma-mock';

// Prisma をモック
const prismaMock = createPrismaMock();
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

// auth をモック
const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

// logger をモック
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// countPartnerAccounts / checkAccountLimit をモック
const mockCheckAccountLimit = vi.fn();
vi.mock('@/lib/partner/accounts', () => ({
  countPartnerAccounts: vi.fn().mockResolvedValue(50),
  checkAccountLimit: (...args: unknown[]) => mockCheckAccountLimit(...args),
}));

describe('GET /api/partner/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未認証の場合は401', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/partner/dashboard/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('パートナーでないユーザーは403', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-1' },
    });
    prismaMock.partner.findUnique.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/partner/dashboard/route');
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('パートナー管理者はダッシュボード情報を取得可能', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-1' },
    });

    prismaMock.partner.findUnique.mockResolvedValueOnce({
      id: 'partner-1',
      name: 'Test Partner',
      brandName: 'Test Brand',
      plan: 'basic',
      accountStatus: 'active',
      maxAccounts: 300,
    });

    mockCheckAccountLimit.mockResolvedValueOnce({
      currentCount: 50,
      maxAccounts: 300,
      canAddMore: true,
      warningLevel: 'normal',
    });

    prismaMock.corporateTenant.count.mockResolvedValueOnce(3);
    prismaMock.user.count.mockResolvedValueOnce(5);
    prismaMock.profile.aggregate.mockResolvedValueOnce({
      _sum: { views: 1200 },
    });

    const { GET } = await import('@/app/api/partner/dashboard/route');
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.partner.name).toBe('Test Partner');
    expect(data.stats.totalTenants).toBe(3);
    expect(data.warningLevel).toBe('normal');
  });
});

describe('GET /api/partner/branding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未認証の場合は401', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/partner/branding/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('パートナーが見つからない場合は404', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-1' },
    });
    prismaMock.partner.findUnique.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/partner/branding/route');
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('パートナーのブランディング情報を返す', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-1' },
    });

    prismaMock.partner.findUnique.mockResolvedValueOnce({
      brandName: 'Test Brand',
      logoUrl: 'https://example.com/logo.png',
      logoWidth: 200,
      logoHeight: 50,
      faviconUrl: null,
      primaryColor: '#FF0000',
      secondaryColor: '#00FF00',
      customDomain: 'card.test.com',
      domainVerified: true,
      companyName: 'テスト株式会社',
      companyAddress: '東京都渋谷区',
      privacyPolicyUrl: null,
      termsUrl: null,
      emailFromName: 'Test Brand',
      supportEmail: 'support@test.com',
    });

    const { GET } = await import('@/app/api/partner/branding/route');
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.branding.brandName).toBe('Test Brand');
    expect(data.branding.primaryColor).toBe('#FF0000');
  });
});

describe('POST /api/partner/tenants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未認証の場合は401', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/partner/tenants/route');
    const req = new Request('http://localhost/api/partner/tenants', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Tenant', adminEmail: 'admin@test.com' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('パートナーが見つからないかinactiveの場合は403', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-1' },
    });
    prismaMock.partner.findUnique.mockResolvedValueOnce({
      id: 'partner-1',
      accountStatus: 'suspended',
    });

    const { POST } = await import('@/app/api/partner/tenants/route');
    const req = new Request('http://localhost/api/partner/tenants', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Tenant', adminEmail: 'admin@test.com' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('アカウント上限到達時は400', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-1' },
    });
    prismaMock.partner.findUnique.mockResolvedValueOnce({
      id: 'partner-1',
      accountStatus: 'active',
    });
    mockCheckAccountLimit.mockResolvedValueOnce({
      currentCount: 300,
      maxAccounts: 300,
      canAddMore: false,
      warningLevel: 'critical',
    });

    const { POST } = await import('@/app/api/partner/tenants/route');
    const req = new Request('http://localhost/api/partner/tenants', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Tenant', adminEmail: 'admin@test.com' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
