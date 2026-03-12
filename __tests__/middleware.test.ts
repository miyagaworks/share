// __tests__/middleware.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// next-auth/jwt をモック
const mockGetToken = vi.fn();
vi.mock('next-auth/jwt', () => ({
  getToken: (...args: unknown[]) => mockGetToken(...args),
}));

// lib/auth/constants をモック
vi.mock('@/lib/auth/constants', () => ({
  isSuperAdmin: (email: string | null | undefined) => email === 'admin@sns-share.com',
}));

// lib/features をモック
vi.mock('@/lib/features', () => ({
  features: {
    superAdmin: true,
    financialAdmin: true,
    partnerModule: true,
    stripePayment: false,
    nfcSealOrder: true,
  },
}));

// NextRequest/NextResponse をモック
class MockHeaders {
  private headers: Map<string, string>;
  constructor(init?: Record<string, string>) {
    this.headers = new Map(Object.entries(init || {}));
  }
  get(name: string) {
    return this.headers.get(name) || null;
  }
  set(name: string, value: string) {
    this.headers.set(name, value);
  }
  delete(name: string) {
    this.headers.delete(name);
  }
  has(name: string) {
    return this.headers.has(name);
  }
}

function createMockRequest(pathname: string, host = 'app.sns-share.com'): any {
  return {
    nextUrl: {
      pathname,
      searchParams: new URLSearchParams(),
    },
    url: `https://${host}${pathname}`,
    headers: new MockHeaders({ host }),
  };
}

// NextResponse をモック
vi.mock('next/server', () => {
  return {
    NextResponse: {
      next: () => ({
        headers: new MockHeaders(),
        status: 200,
      }),
      redirect: (url: URL) => ({
        headers: new MockHeaders(),
        status: 307,
        redirectUrl: url.pathname || url.toString(),
      }),
    },
  };
});

// 環境変数のモック
const originalEnv = process.env;

import { middleware } from '@/middleware';

describe('middleware - isMainDomain 判定', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, PARTNER_DOMAIN_MAP: '{}' };
  });

  it('sns-share.com はメインドメイン', async () => {
    const req = createMockRequest('/some-page', 'sns-share.com');
    const res = await middleware(req);
    // ダッシュボード以外のパスなのでそのまま通過し、x-partner-id はセットされない
    expect(res.headers.has('x-partner-id')).toBe(false);
  });

  it('app.sns-share.com はメインドメイン', async () => {
    const req = createMockRequest('/some-page', 'app.sns-share.com');
    const res = await middleware(req);
    expect(res.headers.has('x-partner-id')).toBe(false);
  });

  it('localhost はメインドメイン', async () => {
    const req = createMockRequest('/some-page', 'localhost:3000');
    const res = await middleware(req);
    expect(res.headers.has('x-partner-id')).toBe(false);
  });

  it('*.vercel.app はメインドメイン', async () => {
    const req = createMockRequest('/some-page', 'share-abc.vercel.app');
    const res = await middleware(req);
    expect(res.headers.has('x-partner-id')).toBe(false);
  });

  it('カスタムドメインでは PARTNER_DOMAIN_MAP からpartnerIDを解決', async () => {
    process.env.PARTNER_DOMAIN_MAP = '{"card.example.co.jp":"partner_123"}';
    // モジュールキャッシュをリセットするため動的importは使えないので、
    // 環境変数を読み直すために middleware を再度呼ぶ
    const req = createMockRequest('/some-page', 'card.example.co.jp');
    const res = await middleware(req);
    expect(res.headers.get('x-partner-id')).toBe('partner_123');
  });

  it('PARTNER_DOMAIN_MAP に存在しないカスタムドメインの場合、partnerIDはセットされない', async () => {
    process.env.PARTNER_DOMAIN_MAP = '{"card.example.co.jp":"partner_123"}';
    const req = createMockRequest('/some-page', 'unknown.example.com');
    const res = await middleware(req);
    expect(res.headers.has('x-partner-id')).toBe(false);
  });
});

describe('middleware - ダッシュボードルーティング', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, PARTNER_DOMAIN_MAP: '{}' };
  });

  it('未認証ユーザーはサインインページにリダイレクト', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/dashboard');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.redirectUrl).toContain('/auth/signin');
  });

  it('super-admin は /dashboard から /dashboard/admin にリダイレクト', async () => {
    mockGetToken.mockResolvedValueOnce({
      email: 'admin@sns-share.com',
      role: 'super-admin',
    });
    const req = createMockRequest('/dashboard');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.redirectUrl).toContain('/dashboard/admin');
  });

  it('super-admin は /dashboard/admin にアクセスできる', async () => {
    mockGetToken.mockResolvedValueOnce({
      email: 'admin@sns-share.com',
      role: 'super-admin',
    });
    const req = createMockRequest('/dashboard/admin');
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });

  it('financial-admin は /dashboard から /dashboard/admin にリダイレクト', async () => {
    mockGetToken.mockResolvedValueOnce({
      email: 'finance@sns-share.com',
      role: 'financial-admin',
    });
    const req = createMockRequest('/dashboard');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.redirectUrl).toContain('/dashboard/admin');
  });

  it('financial-admin は許可パスにのみアクセス可能', async () => {
    mockGetToken.mockResolvedValueOnce({
      email: 'finance@sns-share.com',
      role: 'financial-admin',
    });
    const req = createMockRequest('/dashboard/admin/financial');
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });

  it('financial-admin は /dashboard/corporate にアクセスできない', async () => {
    mockGetToken.mockResolvedValueOnce({
      email: 'finance@sns-share.com',
      role: 'financial-admin',
    });
    const req = createMockRequest('/dashboard/corporate/settings');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.redirectUrl).toContain('/dashboard/admin');
  });

  it('partner-admin は /dashboard から /dashboard/partner にリダイレクト', async () => {
    mockGetToken.mockResolvedValueOnce({
      email: 'partner@example.com',
      role: 'partner-admin',
    });
    const req = createMockRequest('/dashboard');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.redirectUrl).toContain('/dashboard/partner');
  });

  it('partner-admin は /dashboard/partner にアクセスできる', async () => {
    mockGetToken.mockResolvedValueOnce({
      email: 'partner@example.com',
      role: 'partner-admin',
    });
    const req = createMockRequest('/dashboard/partner/settings');
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });

  it('partner-admin は /dashboard/admin にアクセスできない', async () => {
    mockGetToken.mockResolvedValueOnce({
      email: 'partner@example.com',
      role: 'partner-admin',
    });
    const req = createMockRequest('/dashboard/admin');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.redirectUrl).toContain('/dashboard/partner');
  });

  it('admin は /dashboard から /dashboard/corporate にリダイレクト', async () => {
    mockGetToken.mockResolvedValueOnce({
      email: 'corp@example.com',
      role: 'admin',
    });
    const req = createMockRequest('/dashboard');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.redirectUrl).toContain('/dashboard/corporate');
  });

  it('member は /dashboard から /dashboard/corporate-member にリダイレクト', async () => {
    mockGetToken.mockResolvedValueOnce({
      email: 'member@example.com',
      role: 'member',
    });
    const req = createMockRequest('/dashboard');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.redirectUrl).toContain('/dashboard/corporate-member');
  });

  it('member は /dashboard/corporate にアクセスできない', async () => {
    mockGetToken.mockResolvedValueOnce({
      email: 'member@example.com',
      role: 'member',
    });
    const req = createMockRequest('/dashboard/corporate/settings');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.redirectUrl).toContain('/dashboard/corporate-member');
  });

  it('個人ユーザーは /dashboard/admin にアクセスできない', async () => {
    mockGetToken.mockResolvedValueOnce({
      email: 'personal@example.com',
      role: 'personal',
    });
    const req = createMockRequest('/dashboard/admin');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.redirectUrl).toContain('/dashboard');
  });

  it('個人ユーザーは /dashboard/corporate にアクセスできない', async () => {
    mockGetToken.mockResolvedValueOnce({
      email: 'personal@example.com',
      role: 'personal',
    });
    const req = createMockRequest('/dashboard/corporate');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.redirectUrl).toContain('/dashboard');
  });
});

describe('middleware - auth関連URLの処理', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, PARTNER_DOMAIN_MAP: '{}' };
  });

  it('/auth パスはそのまま通過する', async () => {
    const req = createMockRequest('/auth/signin');
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });

  it('/api/auth パスはそのまま通過する', async () => {
    const req = createMockRequest('/api/auth/callback');
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });

  it('カスタムドメインの /auth パスでも x-partner-id がセットされる', async () => {
    process.env.PARTNER_DOMAIN_MAP = '{"card.example.co.jp":"partner_123"}';
    const req = createMockRequest('/auth/signin', 'card.example.co.jp');
    const res = await middleware(req);
    expect(res.headers.get('x-partner-id')).toBe('partner_123');
  });
});
