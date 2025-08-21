// app/api/one-tap-seal/orders/route.ts
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

    // ユーザーの注文履歴を取得
    const orders = await prisma.oneTapSealOrder.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        items: true,
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

    // OneTapSealOrder型に整形
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
        memberName: null, // 個人注文では不要
        memberEmail: null,
      })),
      tenant: order.tenant,
      user: {
        name: null, // 自分の注文なので不要
        email: session.user.email || '',
      },
    }));

    return NextResponse.json({ orders: formattedOrders });
  } catch (error) {
    logger.error('ワンタップシール注文履歴取得エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}