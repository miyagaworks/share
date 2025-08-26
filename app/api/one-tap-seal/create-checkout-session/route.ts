// app/api/one-tap-seal/create-checkout-session/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { stripe, isStripeAvailable } from '@/lib/stripe';
import { logger } from '@/lib/utils/logger';
import { ONE_TAP_SEAL_CONFIG } from '@/types/one-tap-seal';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    if (!isStripeAvailable() || !stripe) {
      return NextResponse.json(
        { error: '決済システムが正しく構成されていません' },
        { status: 500 },
      );
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: '注文IDが必要です' }, { status: 400 });
    }

    // 注文情報の取得
    const order = await prisma.oneTapSealOrder.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
        status: 'pending',
      },
      include: {
        items: true,
        user: {
          select: {
            email: true,
            stripeCustomerId: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: '注文が見つからないか、既に処理済みです' },
        { status: 404 },
      );
    }

    // Stripeカスタマー取得または作成
    let customerId = order.user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: order.user.email,
        metadata: {
          userId: session.user.id,
        },
      });

      customerId = customer.id;

      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Checkout Session作成
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: 'ワンタップシール',
              description: `NFCタグシール ${order.items.reduce((sum, item) => sum + item.quantity, 0)}枚`,
            },
            unit_amount: ONE_TAP_SEAL_CONFIG.UNIT_PRICE,
          },
          quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
        },
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: '配送料',
              description: 'クリックポスト',
            },
            unit_amount: ONE_TAP_SEAL_CONFIG.SHIPPING_FEE,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/subscription?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/subscription?canceled=true`,
      metadata: {
        userId: session.user.id,
        orderId: order.id,
        subscriptionType: 'one_tap_seal_only',
      },
    });

    // 注文にCheckout Session IDを保存
    await prisma.oneTapSealOrder.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: checkoutSession.id },
    });

    logger.info('ワンタップシール Checkout Session作成完了', {
      sessionId: checkoutSession.id,
      orderId: order.id,
      amount: order.totalAmount,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    logger.error('Checkout Session作成エラー:', error);
    return NextResponse.json({ error: '決済セッションの作成に失敗しました' }, { status: 500 });
  }
}