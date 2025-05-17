// app/api/corporate-member/profile/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { checkPermanentAccess, getVirtualTenantData } from '@/lib/corporateAccessState';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 永久利用権ユーザーかどうかチェック
    const isPermanent = checkPermanentAccess();

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        nameEn: true,
        nameKana: true,
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

    // 永久利用権ユーザーの場合
    if (isPermanent || user.subscriptionStatus === 'permanent') {
      console.log('永久利用権ユーザー用プロフィール情報を生成:', user.id);

      // 仮想テナントデータを取得
      const virtualData = getVirtualTenantData();

      // 仮想テナントがない場合はデフォルト値を設定
      const virtualTenantId = `virtual-tenant-${user.id}`;
      const virtualTenantName = virtualData?.name || `${user.name || 'ユーザー'}の法人`;
      const virtualPrimaryColor = virtualData?.settings?.primaryColor || '#3B82F6';
      const virtualSecondaryColor = virtualData?.settings?.secondaryColor || '#60A5FA';

      // 仮想SNSリンク
      const virtualSnsLinks = virtualData?.snsLinks || [
        {
          id: `vs-1-${user.id}`,
          platform: 'line',
          url: 'https://line.me/ti/p/~',
          username: null,
          displayOrder: 1,
          isRequired: true,
        },
        {
          id: `vs-2-${user.id}`,
          platform: 'instagram',
          url: 'https://www.instagram.com/',
          username: null,
          displayOrder: 2,
          isRequired: true,
        },
        {
          id: `vs-3-${user.id}`,
          platform: 'youtube',
          url: 'https://www.youtube.com/c/',
          username: null,
          displayOrder: 3,
          isRequired: false,
        },
      ];

      // 仮想部署
      const virtualDepartment = {
        id: 'default-dept',
        name: '全社',
      };

      // 仮想テナント情報
      const virtualTenant = {
        id: virtualTenantId,
        name: virtualTenantName,
        logoUrl: null,
        primaryColor: virtualPrimaryColor,
        secondaryColor: virtualSecondaryColor,
        corporateSnsLinks: virtualSnsLinks,
      };

      // センシティブな情報を除外
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...safeUser } = user;

      // ユーザー情報を仮想テナント用に更新
      const virtualUser = {
        ...safeUser,
        corporateRole: 'admin',
        department: virtualDepartment,
        tenant: null, // 既存のtenantを削除
        adminOfTenant: null, // 既存のadminOfTenantを削除
        // adminOfTenantに仮想テナントを設定（フロントエンドのルールに従って）
        // 注: この値は実際のDBとは異なりますが、フロントエンド側の処理のためのもの
      };

      return NextResponse.json({
        success: true,
        user: virtualUser,
        tenant: virtualTenant,
      });
    }

    // 通常のユーザー処理（永久利用権ユーザーでない場合）

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