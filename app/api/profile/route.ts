// app/api/profile/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
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
        subscription: true,
        profile: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    // 既存のコード
    const now = new Date();
    const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
    const isTrialActive = trialEndsAt && now < trialEndsAt;
    const hasActiveSubscription =
      user.subscription &&
      user.subscription.status === 'active' &&
      !user.subscription.cancelAtPeriodEnd;
    const currentStatus = hasActiveSubscription ? 'active' : isTrialActive ? 'trialing' : 'expired';
    // 安全なユーザー情報（パスワードなどの機密情報を除く）
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name || '',
      nameEn: user.nameEn || '',
      nameKana: user.nameKana || '',
      lastName: user.lastName || '',
      firstName: user.firstName || '',
      lastNameKana: user.lastNameKana || '',
      firstNameKana: user.firstNameKana || '',
      image: user.image,
      bio: user.bio || '',
      phone: user.phone || '',
      company: user.company || '',
      companyUrl: user.companyUrl || '',
      companyLabel: user.companyLabel || '',
      mainColor: user.mainColor,
      snsIconColor: user.snsIconColor || '',
      bioBackgroundColor: user.bioBackgroundColor || '',
      bioTextColor: user.bioTextColor || '',
      headerText: user.headerText || '',
      textColor: user.textColor || '',
      profile: user.profile,
      trialEndsAt: user.trialEndsAt,
      subscriptionStatus: currentStatus,
    };
    return NextResponse.json({
      user: safeUser,
    });
  } catch (error) {
    logger.error('プロフィール取得エラー:', error);
    return NextResponse.json({ error: 'プロフィールの取得に失敗しました' }, { status: 500 });
  }
}