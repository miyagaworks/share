// app/api/admin/one-tap-seal/orders/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { OneTapSealOrder } from '@/types/one-tap-seal';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 管理者権限チェック - isFinancialAdminまたはadmin@sns-share.comかsuper-adminロール
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        isFinancialAdmin: true,
      },
    });

    const isAuthorized =
      user?.isFinancialAdmin ||
      user?.email === 'admin@sns-share.com' ||
      (session.user as any)?.role === 'super-admin' ||
      (session.user as any)?.role === 'financial-admin';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    // 全てのワンタップシール注文を取得
    const orders = await prisma.oneTapSealOrder.findMany({
      include: {
        items: {
          include: {
            memberUser: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        tenant: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        orderDate: 'desc',
      },
    });

    // 管理者用の形式で整形（OneTapSealOrder型を使用）
    const formattedOrders: OneTapSealOrder[] = orders.map((order) => ({
      id: order.id,
      userId: order.userId,
      tenantId: order.tenantId,
      subscriptionId: order.subscriptionId,
      orderType: order.orderType as 'individual' | 'corporate',
      orderDate: order.orderDate.toISOString(),
      status: order.status as OneTapSealOrder['status'],
      sealTotal: order.sealTotal,
      shippingFee: order.shippingFee,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      shippingAddress: {
        postalCode: order.postalCode,
        address: order.address,
        recipientName: order.recipientName,
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
        qrSlug: item.qrSlug,
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