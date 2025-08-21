// app/api/subscription/verify-payment/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { stripe, isStripeAvailable } from '@/lib/stripe';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      logger.warn('認証エラー: ユーザーIDが見つかりません');
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    if (!isStripeAvailable() || !stripe) {
      logger.error('Stripe APIが利用できません');
      return NextResponse.json(
        { error: '決済システムが正しく構成されていません。管理者にお問い合わせください。' },
        { status: 500 },
      );
    }

    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'セッションIDが必要です' }, { status: 400 });
    }

    logger.info('決済確認開始', { sessionId, userId: session.user.id });

    // Stripe Checkout Sessionを取得
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (!checkoutSession) {
      return NextResponse.json({ error: 'セッションが見つかりません' }, { status: 404 });
    }

    // 支払い完了の確認
    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({
        success: false,
        error: '決済が完了していません',
        paymentStatus: checkoutSession.payment_status,
      });
    }

    // データベースから関連情報を取得
    const result = await prisma.$transaction(async (tx) => {
      // サブスクリプション情報取得
      const subscription = await tx.subscription.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
      });

      // ワンタップシール注文情報取得（存在する場合）
      const oneTapSealOrder = await tx.oneTapSealOrder.findFirst({
        where: {
          userId: session.user.id,
          stripePaymentIntentId: checkoutSession.payment_intent as string,
        },
        include: {
          items: true,
        },
      });

      // ユーザー状態確認
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          subscriptionStatus: true,
          corporateRole: true,
        },
      });

      return {
        subscription,
        oneTapSealOrder,
        user,
      };
    });

    // レスポンス構築
    const responseData = {
      success: true,
      message: result.oneTapSealOrder
        ? 'プラン契約とワンタップシール注文が完了しました'
        : 'プラン契約が完了しました',
      subscription: result.subscription
        ? {
            id: result.subscription.id,
            plan: result.subscription.plan,
            status: result.subscription.status,
            interval: result.subscription.interval,
          }
        : null,
      oneTapSealOrder: result.oneTapSealOrder
        ? {
            id: result.oneTapSealOrder.id,
            status: result.oneTapSealOrder.status,
            totalAmount: result.oneTapSealOrder.totalAmount,
            itemCount: result.oneTapSealOrder.items.reduce((sum, item) => sum + item.quantity, 0),
            orderDate: result.oneTapSealOrder.orderDate,
          }
        : null,
      userStatus: {
        subscriptionStatus: result.user?.subscriptionStatus,
        corporateRole: result.user?.corporateRole,
      },
    };

    logger.info('決済確認完了', {
      sessionId,
      userId: session.user.id,
      hasSubscription: !!result.subscription,
      hasOneTapSealOrder: !!result.oneTapSealOrder,
    });

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('決済確認エラー:', error);
    return NextResponse.json({ error: '決済状況の確認に失敗しました' }, { status: 500 });
  }
}