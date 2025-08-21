// app/api/touch-seal/create-payment-intent/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { stripe, isStripeAvailable } from '@/lib/stripe';
import { z } from 'zod';

// PaymentIntent作成リクエストスキーマ
const CreatePaymentIntentSchema = z.object({
  orderId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // Stripe利用可能性チェック
    if (!isStripeAvailable() || !stripe) {
      logger.error('Stripe is not available');
      return NextResponse.json(
        { error: '決済システムが利用できません。管理者にお問い合わせください。' },
        { status: 500 },
      );
    }

    const body = await request.json();
    const validation = CreatePaymentIntentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'リクエストデータが無効です', details: validation.error.errors },
        { status: 400 },
      );
    }

    const { orderId } = validation.data;

    // 注文の存在確認と権限チェック
    const order = await prisma.touchSealOrder.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
        status: 'pending', // 未決済の注文のみ
      },
      include: {
        items: true,
        user: {
          select: {
            email: true,
            name: true,
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

    // Stripeカスタマーの取得または作成
    let customerId = order.user.stripeCustomerId;

    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: order.user.email,
          name: order.user.name || undefined,
          metadata: {
            userId: session.user.id,
          },
        });

        customerId = customer.id;

        // ユーザーテーブルにStripeカスタマーIDを保存
        await prisma.user.update({
          where: { id: session.user.id },
          data: { stripeCustomerId: customerId },
        });
      } catch (stripeError) {
        logger.error('Stripe customer creation failed:', stripeError);
        return NextResponse.json({ error: 'カスタマー情報の作成に失敗しました' }, { status: 500 });
      }
    }

    // PaymentIntent作成
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: order.totalAmount, // 既に税込み金額
        currency: 'jpy',
        customer: customerId,
        metadata: {
          orderId: order.id,
          userId: session.user.id,
          orderType: 'touch_seal',
          itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0).toString(),
        },
        description: `タッチシール注文 - ${order.items.reduce((sum, item) => sum + item.quantity, 0)}枚`,
        receipt_email: order.user.email,
        setup_future_usage: 'off_session',
      });

      // 注文にPaymentIntent IDを保存
      await prisma.touchSealOrder.update({
        where: { id: orderId },
        data: { stripePaymentIntentId: paymentIntent.id },
      });

      logger.info('PaymentIntent作成完了', {
        orderId,
        paymentIntentId: paymentIntent.id,
        amount: order.totalAmount,
        userId: session.user.id,
      });

      return NextResponse.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (stripeError) {
      logger.error('PaymentIntent creation failed:', stripeError);
      return NextResponse.json({ error: '決済の準備に失敗しました' }, { status: 500 });
    }
  } catch (error) {
    logger.error('PaymentIntent作成エラー:', error);
    return NextResponse.json({ error: '決済の準備に失敗しました' }, { status: 500 });
  }
}

// PaymentIntentのステータス確認
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent_id');

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'PaymentIntent IDが必要です' }, { status: 400 });
    }

    // 該当する注文を確認
    const order = await prisma.touchSealOrder.findFirst({
      where: {
        stripePaymentIntentId: paymentIntentId,
        userId: session.user.id,
      },
    });

    if (!order) {
      return NextResponse.json({ error: '注文が見つかりません' }, { status: 404 });
    }

    if (!isStripeAvailable() || !stripe) {
      return NextResponse.json({ error: 'Stripe設定エラー' }, { status: 500 });
    }

    // StripeからPaymentIntentを取得
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      // 決済完了処理
      if (paymentIntent.status === 'succeeded' && order.status === 'pending') {
        await prisma.touchSealOrder.update({
          where: { id: order.id },
          data: { status: 'paid' },
        });

        logger.info('タッチシール注文決済完了', {
          orderId: order.id,
          paymentIntentId,
          amount: paymentIntent.amount,
          userId: session.user.id,
        });
      }

      return NextResponse.json({
        success: true,
        status: paymentIntent.status,
        orderStatus: paymentIntent.status === 'succeeded' ? 'paid' : order.status,
      });
    } catch (stripeError) {
      logger.error('PaymentIntent retrieval failed:', stripeError);
      return NextResponse.json({ error: '決済状況の確認に失敗しました' }, { status: 500 });
    }
  } catch (error) {
    logger.error('PaymentIntent確認エラー:', error);
    return NextResponse.json({ error: '決済状況の確認に失敗しました' }, { status: 500 });
  }
}