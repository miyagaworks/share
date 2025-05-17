// app/api/corporate/tenant/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generateVirtualTenantData } from '@/lib/corporateAccessState';

export async function GET() {
  try {
    console.log('[API] /api/corporate/tenant リクエスト受信');

    // セッション認証チェック
    const session = await auth();

    if (!session || !session.user?.id) {
      console.log('[API] 認証されていないアクセス');
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('[API] ユーザーID:', userId);

    try {
      // クエリを大幅に最適化 - 最低限必要なデータのみを取得
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true, // 仮想テナント用に名前も取得
          subscriptionStatus: true, // 永久利用権ステータスを取得
          // 管理者テナント - 基本情報のみ
          adminOfTenant: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              logoWidth: true,
              logoHeight: true,
              primaryColor: true,
              secondaryColor: true,
              headerText: true,
              textColor: true,
              maxUsers: true,
              accountStatus: true,
              // ユーザー数のカウントのみ
              _count: {
                select: {
                  users: true,
                  departments: true,
                },
              },
            },
          },
          // 一般テナント - 基本情報のみ
          tenant: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              logoWidth: true,
              logoHeight: true,
              primaryColor: true,
              secondaryColor: true,
              headerText: true,
              textColor: true,
              maxUsers: true,
              accountStatus: true,
              // ユーザー数のカウントのみ
              _count: {
                select: {
                  users: true,
                  departments: true,
                },
              },
            },
          },
        },
      });

      // ユーザーが見つからない場合
      if (!user) {
        console.log('[API] ユーザーが見つかりません:', userId);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // 永久利用権ユーザーの場合、仮想テナントデータを生成して返す
      if (user.subscriptionStatus === 'permanent') {
        console.log('[API] 永久利用権ユーザー用仮想テナントデータを生成:', userId);
        const virtualTenant = generateVirtualTenantData(userId, user.name);

        // 仮想テナントデータをレスポンス形式に変換
        const responseData = {
          tenant: {
            id: virtualTenant.id,
            name: virtualTenant.name,
            logoUrl: virtualTenant.settings.logoUrl,
            logoWidth: null,
            logoHeight: null,
            primaryColor: virtualTenant.settings.primaryColor,
            secondaryColor: virtualTenant.settings.secondaryColor,
            headerText: null,
            textColor: null,
            maxUsers: 50,
            accountStatus: 'active',
            userCount: 1,
            departmentCount: virtualTenant.departments.length,
            users: [{ id: userId, name: user.name, role: 'admin' }],
            departments: virtualTenant.departments,
          },
          isAdmin: true,
          userRole: 'admin',
        };

        return NextResponse.json(responseData);
      }

      // 法人テナント情報を取得（管理者または一般メンバー）
      const tenant = user.adminOfTenant || user.tenant;

      // テナントが見つからない場合
      if (!tenant) {
        console.log('[API] テナントが見つかりません:', userId);
        return NextResponse.json({ error: 'No tenant associated with this user' }, { status: 404 });
      }

      // 管理者権限の確認
      const isAdmin = !!user.adminOfTenant;
      const userRole = isAdmin ? 'admin' : 'member';

      console.log('[API] テナント情報取得成功:', {
        tenantId: tenant.id,
        isAdmin,
        userRole,
      });

      // アカウント停止状態確認
      if (tenant.accountStatus === 'suspended') {
        console.log('[API] テナントは停止状態です:', tenant.id);
        return NextResponse.json(
          {
            error: 'Account is suspended',
            tenant: {
              id: tenant.id,
              name: tenant.name,
              accountStatus: 'suspended',
            },
            isAdmin,
            userRole,
          },
          { status: 403 },
        );
      }

      // 必要なプロパティのみを選択してレスポンスを作成
      const responseData = {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          logoUrl: tenant.logoUrl,
          logoWidth: tenant.logoWidth,
          logoHeight: tenant.logoHeight,
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
          headerText: tenant.headerText,
          textColor: tenant.textColor,
          maxUsers: tenant.maxUsers,
          accountStatus: tenant.accountStatus,
          userCount: tenant._count?.users ?? 0,
          departmentCount: tenant._count?.departments ?? 0,
          // 空の配列をフロントエンドの互換性のために提供
          users: [],
          departments: [],
        },
        isAdmin,
        userRole,
      };

      // 正常レスポンス
      return NextResponse.json(responseData);
    } catch (dbError) {
      console.error('[API] データベースエラー:', dbError);
      return NextResponse.json(
        {
          error: 'Database operation failed',
          details: dbError instanceof Error ? dbError.message : String(dbError),
          code: 'DB_ERROR',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[API] テナント情報取得エラー:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch tenant information',
        details: errorMessage,
        code: 'API_ERROR',
      },
      { status: 500 },
    );
  } finally {
    // 接続を必ず解放
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.error('[API] Prisma切断エラー:', e);
    }
  }
}