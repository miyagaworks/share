// app/api/subscription/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
// import { stripe } from "@/lib/stripe";

// ご利用プラン情報の型定義
interface MockSubscription {
  id: string;
  userId: string;
  status: string;
  plan: string;
  priceId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEndsAt?: Date | null;
  cancelAtPeriodEnd: boolean;
  isMockData?: boolean;
  interval?: string; // 追加: 更新間隔（month または year）
}

// prismaから取得するサブスクリプションに動的プロパティを追加する型
interface ExtendedSubscription {
  id: string;
  userId: string;
  status: string;
  plan: string;
  priceId: string | null;
  subscriptionId: string | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  cancelReason: string | null;
  [key: string]: unknown;
}
// 請求履歴の型定義（使用するため残します）
interface BillingRecord {
  id: string;
  userId: string;
  amount: number;
  status: string;
  description: string;
  paidAt: Date | null;
  createdAt: Date;
}

// ご利用プラン情報取得API
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // データベースからご利用プラン情報を取得
    let userSubscription = null;
    let userBillingHistory: BillingRecord[] = []; // 明示的に型を指定

    try {
      userSubscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
      });

      // 請求履歴の取得（型を明示的に指定）
      const billingRecords = await prisma.billingRecord.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 10, // 最新10件のみ取得
      });

      userBillingHistory = billingRecords as BillingRecord[];
    } catch (dbError) {
      console.error('データベースクエリエラー:', dbError);
      // エラーが発生した場合はモックデータを使用
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { trialEndsAt: true, subscriptionStatus: true },
    });

    // 永久利用権ユーザーの場合
    const isPermanentUser = user?.subscriptionStatus === 'permanent';

    // ご利用プラン情報が存在する場合、必要なプラン情報を追加
    if (userSubscription) {
      // データベースから取得したサブスクリプションを拡張した型として扱う
      const extendedSubscription = userSubscription as ExtendedSubscription;

      // プランの更新間隔を設定
      // 変換：yearlyプランは年間更新、それ以外は月間更新
      extendedSubscription.interval = extendedSubscription.plan === 'yearly' ? 'year' : 'month';

      // userSubscriptionに代入
      userSubscription = extendedSubscription;
    }

    // モックデータ部分を修正
    if (!userSubscription) {
      const now = new Date();
      const trialEndsAt = user?.trialEndsAt ? new Date(user.trialEndsAt) : null;
      const isTrialActive = trialEndsAt && now < trialEndsAt;

      // 永久利用権ユーザーの場合は特別なモックデータを作成
      if (isPermanentUser) {
        // 永久利用権ユーザー用のモックデータ
        const mockSubscription: MockSubscription = {
          id: 'permanent-subscription-id',
          userId: session.user.id,
          status: 'active', // 常にアクティブ
          plan: 'permanent', // 永久利用プランとして設定
          priceId: 'price_permanent',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(9999, 11, 31), // 非常に遠い未来
          cancelAtPeriodEnd: false,
          interval: 'permanent', // 永久プランの場合
        };

        console.warn('永久利用権ユーザーのモックデータを使用します:', session.user.id);
        userSubscription = mockSubscription;
      } else {
        // 通常ユーザー用のモックデータ
        const mockSubscription: MockSubscription = {
          id: 'mock-id-DO-NOT-USE-IN-PRODUCTION',
          userId: session.user.id,
          status: isTrialActive ? 'trialing' : user?.subscriptionStatus || 'incomplete',
          plan: isTrialActive ? 'trial' : 'none',
          priceId: 'price_mock',
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEndsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
          isMockData: true,
          interval: isTrialActive ? 'trial' : 'month', // トライアルまたはデフォルトの更新間隔
        };

        console.warn('WARNING: Using mock subscription data for user:', session.user.id);
        userSubscription = mockSubscription;
      }
    }

    // 永久利用権ユーザーなら、サブスクリプションデータも修正
    if (isPermanentUser && userSubscription) {
      userSubscription.plan = 'permanent'; // 永久利用プランに設定
      userSubscription.interval = 'permanent'; // 永久利用には更新間隔なし
    }

    // トライアル期間の残り日数を計算
    let trialDaysRemaining = 0;
    if (user?.trialEndsAt) {
      const trialEnd = new Date(user.trialEndsAt);
      const now = new Date();
      if (trialEnd > now) {
        trialDaysRemaining = Math.ceil(
          (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
      }
    }

    // モックデータをレスポンスとして返す
    return NextResponse.json({
      success: true,
      subscription: {
        ...userSubscription,
        // 永久利用権ユーザーであれば明示的にフラグを追加
        isPermanentUser: isPermanentUser,
        // 永久利用権ユーザーの場合は表示用のステータスも設定
        displayStatus: isPermanentUser ? '永久利用可能' : undefined,
        // トライアル残り日数を追加
        trialDaysRemaining:
          user?.trialEndsAt && userSubscription?.status === 'trialing' ? trialDaysRemaining : 0,
      },
      billingHistory: userBillingHistory,
      message: 'ご利用のプラン情報を取得しました',
    });
  } catch (error) {
    console.error('ご利用のプラン取得エラー:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'ご利用のプラン情報の取得に失敗しました';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}