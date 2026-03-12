// app/api/admin/partners/domain/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PrismaMock } from '@/__tests__/helpers/prisma-mock';

// Prisma をモック
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

// fetch をモック（Vercel API用）
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { POST, GET, DELETE } from '@/app/api/admin/partners/domain/route';
import { prisma } from '@/lib/prisma';

const prismaMock = prisma as unknown as PrismaMock;

// NextRequest のモック
function createNextRequest(
  method: string,
  body?: Record<string, unknown>,
  searchParams?: Record<string, string>,
): any {
  return {
    json: () => Promise.resolve(body || {}),
    nextUrl: {
      searchParams: new URLSearchParams(searchParams),
    },
  };
}

describe('POST /api/admin/partners/domain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.VERCEL_API_TOKEN;
    delete process.env.VERCEL_PROJECT_ID;
  });

  it('非Super Admin は403', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: 'user@example.com' },
    });

    const req = createNextRequest('POST', { partnerId: 'p1', domain: 'test.com' });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('partnerId/domain がない場合は400', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: 'admin@sns-share.com' },
    });

    const req = createNextRequest('POST', { partnerId: 'p1' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('無効なドメイン形式は400', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: 'admin@sns-share.com' },
    });

    const req = createNextRequest('POST', {
      partnerId: 'p1',
      domain: 'invalid domain!!',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('無効なドメイン形式です');
  });

  it('パートナーが存在しない場合は404', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: 'admin@sns-share.com' },
    });

    prismaMock.partner.findUnique.mockResolvedValueOnce(null);

    const req = createNextRequest('POST', {
      partnerId: 'p1',
      domain: 'card.example.com',
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('ドメイン重複は409', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: 'admin@sns-share.com' },
    });

    prismaMock.partner.findUnique.mockResolvedValueOnce({ id: 'p1' });
    prismaMock.partner.findFirst.mockResolvedValueOnce({ id: 'p2', customDomain: 'card.example.com' });

    const req = createNextRequest('POST', {
      partnerId: 'p1',
      domain: 'card.example.com',
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('正常にドメイン登録（Vercel API未設定時はDBのみ更新）', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: 'admin@sns-share.com' },
    });

    prismaMock.partner.findUnique.mockResolvedValueOnce({ id: 'p1' });
    prismaMock.partner.findFirst.mockResolvedValueOnce(null);
    prismaMock.partner.update.mockResolvedValueOnce({});

    const req = createNextRequest('POST', {
      partnerId: 'p1',
      domain: 'card.example.com',
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.vercelConfigured).toBe(false);
    expect(data.dnsInstructions.type).toBe('CNAME');
  });
});

describe('GET /api/admin/partners/domain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('非Super Admin は403', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: 'user@example.com' },
    });

    const req = createNextRequest('GET', undefined, { partnerId: 'p1' });
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('partnerIdがない場合は400', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: 'admin@sns-share.com' },
    });

    const req = createNextRequest('GET', undefined, {});
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('ドメイン未設定の場合は404', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: 'admin@sns-share.com' },
    });

    prismaMock.partner.findUnique.mockResolvedValueOnce({
      customDomain: null,
      domainVerified: false,
    });

    const req = createNextRequest('GET', undefined, { partnerId: 'p1' });
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it('正常にDNSステータスを返す（Vercel API未設定時）', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: 'admin@sns-share.com' },
    });

    prismaMock.partner.findUnique.mockResolvedValueOnce({
      customDomain: 'card.example.com',
      domainVerified: true,
    });

    const req = createNextRequest('GET', undefined, { partnerId: 'p1' });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.domain).toBe('card.example.com');
    expect(data.domainVerified).toBe(true);
  });
});

describe('DELETE /api/admin/partners/domain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('非Super Admin は403', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: 'user@example.com' },
    });

    const req = createNextRequest('DELETE', { partnerId: 'p1' });
    const res = await DELETE(req);
    expect(res.status).toBe(403);
  });

  it('ドメイン未設定の場合は404', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: 'admin@sns-share.com' },
    });

    prismaMock.partner.findUnique.mockResolvedValueOnce({ customDomain: null });

    const req = createNextRequest('DELETE', { partnerId: 'p1' });
    const res = await DELETE(req);
    expect(res.status).toBe(404);
  });

  it('正常にドメイン削除', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: 'admin@sns-share.com' },
    });

    prismaMock.partner.findUnique.mockResolvedValueOnce({
      customDomain: 'card.example.com',
    });
    prismaMock.partner.update.mockResolvedValueOnce({});

    const req = createNextRequest('DELETE', { partnerId: 'p1' });
    const res = await DELETE(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
