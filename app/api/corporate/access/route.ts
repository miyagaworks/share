// app/api/corporate/access/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * ユーザーの法人アクセス権を確認するためのAPI
 * クライアントサイドで使用することを想定
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { hasCorporateAccess: false, error: '認証されていません' },
        { status: 401 },
      );
    }

    // ユーザーの法人テナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminOfTenant: true,
        tenant: true,
        subscription: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { hasCorporateAccess: false, error: 'ユーザーが見つかりません' },
        { status: 404 },
      );
    }

    // 法人テナントが存在するかチェック
    const hasTenant = !!user.adminOfTenant || !!user.tenant;

    // 法人サブスクリプションが有効かチェック
    const hasCorporateSubscription =
      user.subscription &&
      (user.subscription.plan === 'business' ||
        user.subscription.plan === 'business-plus' ||
        user.subscription.plan === 'enterprise') &&
      user.subscription.status === 'active';

    // 両方の条件を満たす場合のみアクセス権あり
    const hasCorporateAccess = hasTenant && hasCorporateSubscription;

    if (!hasCorporateAccess) {
      return NextResponse.json(
        {
          hasCorporateAccess: false,
          error: '法人プランにアップグレードしてください。',
          isAuthenticated: true,
        },
        { status: 403 },
      );
    }

    // テナント情報を取得（管理者または一般メンバーのいずれか）
    const tenant = user.adminOfTenant || user.tenant;

    return NextResponse.json({
      hasCorporateAccess: true,
      isAdmin: !!user.adminOfTenant,
      userRole: user.adminOfTenant ? 'admin' : user.corporateRole || 'member',
      tenant: {
        id: tenant?.id,
        name: tenant?.name,
      },
      isAuthenticated: true,
    });
  } catch (error) {
    console.error('法人アクセス確認エラー:', error);
    return NextResponse.json(
      {
        hasCorporateAccess: false,
        error: '法人アクセス権の確認中にエラーが発生しました',
        isAuthenticated: true,
      },
      { status: 500 },
    );
  }
}