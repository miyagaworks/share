// app/api/partner/__tests__/seal-orders.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrismaMock } from '@/__tests__/helpers/prisma-mock';

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

describe('GET /api/partner/seal-orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未認証の場合は401', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/partner/seal-orders/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('パートナーでないユーザーは403', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-1' },
    });
    prismaMock.partner.findUnique.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/partner/seal-orders/route');
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('パートナー配下の注文一覧を取得できる', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'partner-admin-1' },
    });

    prismaMock.partner.findUnique.mockResolvedValueOnce({
      id: 'partner-1',
    });

    // パートナー配下のテナント
    prismaMock.corporateTenant.findMany.mockResolvedValueOnce([
      { id: 'tenant-1' },
      { id: 'tenant-2' },
    ]);

    // パートナー配下の直接ユーザー
    prismaMock.user.findMany.mockResolvedValueOnce([
      { id: 'direct-user-1' },
    ]);

    // 注文データ
    const now = new Date();
    prismaMock.oneTapSealOrder.findMany.mockResolvedValueOnce([
      {
        id: 'order-1',
        userId: 'user-in-tenant-1',
        tenantId: 'tenant-1',
        subscriptionId: null,
        orderType: 'corporate',
        status: 'paid',
        sealTotal: 1100,
        shippingFee: 185,
        taxAmount: 0,
        totalAmount: 1285,
        shippingAddress: {
          postalCode: '100-0001',
          address: '東京都千代田区1-1-1',
          recipientName: 'テスト太郎',
        },
        trackingNumber: null,
        shippedAt: null,
        shippedBy: null,
        stripePaymentIntentId: 'pi_test',
        createdAt: now,
        updatedAt: now,
        user: { email: 'user@test.com', name: 'テストユーザー' },
        tenant: { name: 'テストテナント' },
        items: [
          {
            id: 'item-1',
            orderId: 'order-1',
            memberUserId: null,
            color: 'black',
            quantity: 2,
            unitPrice: 550,
            profileSlug: 'test-slug',
            qrSlug: null,
            createdAt: now,
            memberUser: null,
          },
        ],
      },
    ]);

    const { GET } = await import('@/app/api/partner/seal-orders/route');
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.orders).toHaveLength(1);
    expect(data.orders[0].id).toBe('order-1');
    expect(data.orders[0].status).toBe('paid');
    expect(data.orders[0].totalAmount).toBe(1285);
    expect(data.orders[0].user.email).toBe('user@test.com');
    expect(data.orders[0].tenant.name).toBe('テストテナント');
    expect(data.orders[0].items).toHaveLength(1);
    expect(data.orders[0].items[0].color).toBe('black');
  });

  it('パートナー配下にテナントもユーザーもない場合は空配列（早期リターン）', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'partner-admin-2' },
    });

    prismaMock.partner.findUnique.mockResolvedValueOnce({
      id: 'partner-2',
    });

    prismaMock.corporateTenant.findMany.mockResolvedValueOnce([]);
    prismaMock.user.findMany.mockResolvedValueOnce([]);

    const { GET } = await import('@/app/api/partner/seal-orders/route');
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.orders).toHaveLength(0);
    expect(data.totalCount).toBe(0);
    // 早期リターンにより oneTapSealOrder.findMany が呼ばれないこと
    expect(prismaMock.oneTapSealOrder.findMany).not.toHaveBeenCalled();
  });

  it('テナント経由のみ（直接ユーザー0件）で注文を取得できる', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'partner-admin-3' },
    });

    prismaMock.partner.findUnique.mockResolvedValueOnce({
      id: 'partner-3',
    });

    prismaMock.corporateTenant.findMany.mockResolvedValueOnce([
      { id: 'tenant-10' },
    ]);
    prismaMock.user.findMany.mockResolvedValueOnce([]);

    const now = new Date();
    prismaMock.oneTapSealOrder.findMany.mockResolvedValueOnce([
      {
        id: 'order-tenant-only',
        userId: 'user-in-tenant',
        tenantId: 'tenant-10',
        subscriptionId: null,
        orderType: 'corporate',
        status: 'preparing',
        sealTotal: 550,
        shippingFee: 185,
        taxAmount: 0,
        totalAmount: 735,
        shippingAddress: {
          postalCode: '150-0001',
          address: '東京都渋谷区1-1',
          recipientName: 'テナント太郎',
        },
        trackingNumber: null,
        shippedAt: null,
        shippedBy: null,
        stripePaymentIntentId: 'pi_tenant',
        createdAt: now,
        updatedAt: now,
        user: { email: 'tenant-user@test.com', name: 'テナントユーザー' },
        tenant: { name: 'テナントA' },
        items: [],
      },
    ]);

    const { GET } = await import('@/app/api/partner/seal-orders/route');
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.orders).toHaveLength(1);
    expect(data.orders[0].id).toBe('order-tenant-only');
    // OR条件にテナントのみ含まれることを確認
    const findManyCall = prismaMock.oneTapSealOrder.findMany.mock.calls[0][0];
    expect(findManyCall.where.OR).toHaveLength(1);
    expect(findManyCall.where.OR[0]).toHaveProperty('tenantId');
  });

  it('直接ユーザーのみ（テナント0件）で注文を取得できる', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'partner-admin-4' },
    });

    prismaMock.partner.findUnique.mockResolvedValueOnce({
      id: 'partner-4',
    });

    prismaMock.corporateTenant.findMany.mockResolvedValueOnce([]);
    prismaMock.user.findMany.mockResolvedValueOnce([
      { id: 'direct-user-10' },
    ]);

    const now = new Date();
    prismaMock.oneTapSealOrder.findMany.mockResolvedValueOnce([
      {
        id: 'order-user-only',
        userId: 'direct-user-10',
        tenantId: null,
        subscriptionId: null,
        orderType: 'individual',
        status: 'paid',
        sealTotal: 1100,
        shippingFee: 185,
        taxAmount: 0,
        totalAmount: 1285,
        shippingAddress: {
          postalCode: '160-0001',
          address: '東京都新宿区1-1',
          recipientName: '直接花子',
        },
        trackingNumber: null,
        shippedAt: null,
        shippedBy: null,
        stripePaymentIntentId: 'pi_direct',
        createdAt: now,
        updatedAt: now,
        user: { email: 'direct@test.com', name: '直接ユーザー' },
        tenant: null,
        items: [],
      },
    ]);

    const { GET } = await import('@/app/api/partner/seal-orders/route');
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.orders).toHaveLength(1);
    expect(data.orders[0].id).toBe('order-user-only');
    // OR条件にユーザーのみ含まれることを確認
    const findManyCall = prismaMock.oneTapSealOrder.findMany.mock.calls[0][0];
    expect(findManyCall.where.OR).toHaveLength(1);
    expect(findManyCall.where.OR[0]).toHaveProperty('userId');
  });
});
