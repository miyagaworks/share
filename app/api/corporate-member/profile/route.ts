// app/api/corporate-member/profile/route.ts
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

    // ユーザー情報とプロフィール情報を取得
    // includeの代わりにselectを使い、必要なフィールドを明示的に指定
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        nameEn: true,
        nameKana: true, // 明示的に選択
        password: true, // 後で除外するため
        image: true,
        bio: true,
        mainColor: true,
        snsIconColor: true,
        bioBackgroundColor: true,
        bioTextColor: true,
        phone: true,
        company: true,
        companyUrl: true,
        companyLabel: true,
        emailVerified: true,
        stripeCustomerId: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        corporateRole: true,
        position: true,
        departmentId: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,

        // 関連データ
        profile: true,
        department: true,
        tenant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
            corporateSnsLinks: {
              select: {
                id: true,
                platform: true,
                username: true,
                url: true,
                displayOrder: true,
                isRequired: true,
              },
              orderBy: {
                displayOrder: 'asc',
              },
            },
          },
        },
        adminOfTenant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
        snsLinks: {
          select: {
            id: true,
            platform: true,
            username: true,
            url: true,
            displayOrder: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        customLinks: {
          select: {
            id: true,
            name: true,
            url: true,
            displayOrder: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // ユーザーが法人テナントに所属しているか確認
    if (!user.tenant && !user.adminOfTenant) {
      return NextResponse.json({ error: '法人テナントに所属していません' }, { status: 403 });
    }

    // テナント情報を取得（管理者または一般メンバー）
    const tenant = user.adminOfTenant || user.tenant;

    // センシティブな情報を除外して返す
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      user: safeUser,
      tenant: tenant,
    });
  } catch (error) {
    console.error('法人メンバープロフィール取得エラー:', error);
    return NextResponse.json(
      { error: '法人メンバープロフィール情報の取得に失敗しました' },
      { status: 500 },
    );
  }
}