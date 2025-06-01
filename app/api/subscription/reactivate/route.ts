// app/api/subscription/reactivate/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
// import { stripe } from "@/lib/stripe"; // 本番環境では必要
// ご利用プラン再アクティブ化API
export async function POST() {
  try {
    logger.debug('再アクティブ化リクエスト受信');
    const session = await auth();
    if (!session?.user?.id) {
      logger.debug('認証エラー: ユーザーIDが見つかりません');
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    logger.debug('ユーザーID:', session.user.id);
    // ユーザーのご利用プラン情報を取得
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });
    logger.debug('取得したプラン:', subscription);
    if (!subscription) {
      logger.debug('プランが見つかりません');
      return NextResponse.json({ error: 'プランが見つかりません' }, { status: 404 });
    }
    // キャンセル予定ではない場合
    if (!subscription.cancelAtPeriodEnd) {
      logger.debug('プランは既にアクティブです');
      return NextResponse.json(
        {
          success: true,
          message: 'プランは既にアクティブです',
          subscription,
        },
        { status: 200 },
      );
    }
    // ここでStripeの再アクティブ化処理を行う（開発中はコメントアウト可能）
    /*
        await stripe.subscriptions.update(
            subscription.subscriptionId,
            { cancel_at_period_end: false }
        );
        */
    // データベースの情報を更新
    const updatedSubscription = await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        cancelAtPeriodEnd: false,
        cancelReason: null,
        updatedAt: new Date(),
      },
    });
    logger.debug('プラン更新完了:', updatedSubscription);
    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      message: 'プランを再アクティブ化しました',
    });
  } catch (error) {
    logger.error('プラン再アクティブ化エラー:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'プランの再アクティブ化に失敗しました';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
