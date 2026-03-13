// app/api/partner/seal-orders/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { type OneTapSealOrder } from '@/types/one-tap-seal';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // パートナー権限チェック
    const partner = await prisma.partner.findUnique({
      where: { adminUserId: session.user.id },
      select: { id: true },
    });

    if (!partner) {
      return NextResponse.json({ error: 'パートナーが見つかりません' }, { status: 403 });
    }

    // パートナー配下のテナントIDを取得
    const tenants = await prisma.corporateTenant.findMany({
      where: { partnerId: partner.id },
      select: { id: true },
    });
    const tenantIds = tenants.map((t) => t.id);

    // パートナー配下の直接ユーザーIDを取得
    const partnerUsers = await prisma.user.findMany({
      where: { partnerId: partner.id },
      select: { id: true },
    });
    const partnerUserIds = partnerUsers.map((u) => u.id);

    // パートナー配下の注文を取得（テナント経由 + 直接ユーザー経由）
    // テナントもユーザーも0件の場合は空結果を返す（OR: [] の未定義動作を回避）
    const orConditions = [
      ...(tenantIds.length > 0 ? [{ tenantId: { in: tenantIds } }] : []),
      ...(partnerUserIds.length > 0 ? [{ userId: { in: partnerUserIds } }] : []),
    ];

    if (orConditions.length === 0) {
      logger.info('パートナー用シール注文取得完了（配下なし）', {
        partnerId: partner.id,
        orderCount: 0,
      });
      return NextResponse.json({
        success: true,
        orders: [],
        totalCount: 0,
      });
    }

    const orders = await prisma.oneTapSealOrder.findMany({
      where: {
        OR: orConditions,
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        tenant: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            memberUser: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedOrders: OneTapSealOrder[] = orders.map((order) => ({
      id: order.id,
      userId: order.userId,
      tenantId: order.tenantId,
      subscriptionId: order.subscriptionId,
      orderType: order.orderType as 'individual' | 'corporate',
      orderDate: order.createdAt.toISOString().split('T')[0],
      status: order.status as OneTapSealOrder['status'],
      sealTotal: order.sealTotal,
      shippingFee: order.shippingFee,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      shippingAddress: {
        postalCode: (order.shippingAddress as any)?.postalCode || '',
        address: (order.shippingAddress as any)?.address || '',
        recipientName: (order.shippingAddress as any)?.recipientName || '',
      },
      trackingNumber: order.trackingNumber,
      shippedAt: order.shippedAt?.toISOString() || null,
      shippedBy: order.shippedBy,
      stripePaymentIntentId: order.stripePaymentIntentId,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        memberUserId: item.memberUserId,
        color: item.color as any,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        profileSlug: item.profileSlug,
        qrSlug: item.qrSlug || undefined,
        createdAt: item.createdAt.toISOString(),
        memberName: item.memberUser?.name || null,
        memberEmail: item.memberUser?.email || null,
      })),
      user: order.user
        ? {
            name: order.user.name || undefined,
            email: order.user.email,
          }
        : undefined,
      tenant: order.tenant,
    }));

    logger.info('パートナー用シール注文取得完了', {
      partnerId: partner.id,
      orderCount: formattedOrders.length,
    });

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      totalCount: formattedOrders.length,
    });
  } catch (error) {
    logger.error('パートナー用シール注文取得エラー:', error);
    return NextResponse.json({ error: '注文データの取得に失敗しました' }, { status: 500 });
  }
}
