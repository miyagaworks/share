// app/api/auth/debug/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    // セッション情報がない場合
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: '認証されていません。ログインしてください。',
          status: 'unauthenticated',
          session: null,
        },
        { status: 401 },
      );
    }

    // ユーザー情報を取得（サブスクリプションと法人テナント情報を含む）
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        corporateRole: true,
        adminOfTenant: {
          select: { id: true, name: true, accountStatus: true },
        },
        tenant: {
          select: { id: true, name: true, accountStatus: true },
        },
        subscription: {
          select: { id: true, plan: true, status: true },
        },
      },
    });

    // ユーザー情報がない場合
    if (!user) {
      return NextResponse.json(
        {
          message: 'ユーザーが見つかりません',
          status: 'user_not_found',
          session,
        },
        { status: 404 },
      );
    }

    // 法人サブスクリプションのチェック
    const hasCorporateSubscription = checkCorporateSubscription(user.subscription);

    return NextResponse.json({
      message: 'デバッグ情報',
      status: 'authenticated',
      user: {
        id: user.id,
        email: user.email,
        role: user.corporateRole,
        hasTenant: !!(user.adminOfTenant || user.tenant),
        isAdmin: !!user.adminOfTenant,
        tenantStatus: user.adminOfTenant?.accountStatus || user.tenant?.accountStatus,
        subscription: {
          plan: user.subscription?.plan,
          status: user.subscription?.status,
          isValid: hasCorporateSubscription,
        },
      },
      session,
    });
  } catch (error) {
    logger.error('デバッグAPI エラー:', error);

    return NextResponse.json(
      {
        message: 'デバッグ中にエラーが発生しました',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// checkCorporateSubscription関数を再利用
function checkCorporateSubscription(
  subscription: { plan?: string; status?: string } | null,
): boolean {
  if (!subscription) return false;

  const validPlans = ['business', 'business_plus', 'business-plus', 'businessplus', 'enterprise'];
  const normalizedPlan = (subscription.plan || '').toLowerCase().trim();
  const isStatusActive = subscription.status === 'active';
  const isPlanValid = validPlans.some(
    (plan) =>
      normalizedPlan === plan || normalizedPlan.replace(/[-_]/g, '') === plan.replace(/[-_]/g, ''),
  );

  return isStatusActive && isPlanValid;
}