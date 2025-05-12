// app/api/profile/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: true, // サブスクリプション情報も取得
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // トライアル状態の判定
    const now = new Date();
    const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
    const isTrialActive = trialEndsAt && now < trialEndsAt;

    // サブスクリプション状態の判定
    const hasActiveSubscription =
      user.subscription &&
      user.subscription.status === 'active' &&
      !user.subscription.cancelAtPeriodEnd;

    // 正確な状態をセット
    const currentStatus = hasActiveSubscription ? 'active' : isTrialActive ? 'trialing' : 'expired';

    // 安全に返すユーザー情報を整形
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      trialEndsAt: user.trialEndsAt,
      subscriptionStatus: currentStatus, // 正確な状態を反映
      // 他の必要なフィールド
    };

    return NextResponse.json({
      user: safeUser,
    });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json({ error: 'プロフィールの取得に失敗しました' }, { status: 500 });
  }
}