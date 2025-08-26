// app/api/admin/one-tap-seal/orders/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { type OneTapSealOrder } from '@/types/one-tap-seal';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 管理者権限チェック
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isFinancialAdmin: true, email: true },
    });

    if (!user || !user.isFinancialAdmin) {
      logger.warn('管理者以外のワンタップシール注文アクセス試行', {
        userId: session.user.id,
        email: user?.email,
        isFinancialAdmin: user?.isFinancialAdmin,
      });
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    // 注文データを取得（管理者用）
    const orders = await prisma.oneTapSealOrder.findMany({
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
        profileSlug: item.profileSlug, // データベースから取得
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

    logger.info('管理者用ワンタップシール注文取得完了', {
      adminId: session.user.id,
      adminEmail: user?.email,
      orderCount: formattedOrders.length,
    });

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      totalCount: formattedOrders.length,
    });
  } catch (error) {
    logger.error('管理者用ワンタップシール注文取得エラー:', error);
    return NextResponse.json({ error: '注文データの取得に失敗しました' }, { status: 500 });
  }
}