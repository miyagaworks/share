// app/api/one-tap-seal/orders/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { type OneTapSealOrder } from '@/types/one-tap-seal';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ユーザーの注文データを取得
    const orders = await prisma.oneTapSealOrder.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        tenant: {
          select: {
            name: true,
          },
        },
        items: true,
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
        memberName: null, // ユーザー向けAPIでは不要
        memberEmail: null, // ユーザー向けAPIでは不要
      })),
      tenant: order.tenant,
    }));

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error('ワンタップシール注文取得エラー:', error);
    return NextResponse.json({ error: '注文データの取得に失敗しました' }, { status: 500 });
  }
}