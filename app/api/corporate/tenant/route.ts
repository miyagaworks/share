// app/api/corporate/tenant/route.ts (修正版 - エラー解決)
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// generateVirtualTenantData関数を直接定義（依存関係を削減）
function generateVirtualTenantData(userId: string, userName: string | null) {
  return {
    id: `virtual-${userId}`,
    name: `${userName || 'ユーザー'}の法人`,
    settings: {
      logoUrl: null,
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
    },
    departments: [], // 部署は空（オプション）
  };
}

// プランに応じたmaxUsersを取得する関数
function getMaxUsersByPlan(plan: string | null | undefined): number {
  if (!plan) return 10;
  const planLower = plan.toLowerCase();

  if (planLower.includes('enterprise')) {
    return 50;
  }

  if (planLower.includes('business') && !planLower.includes('starter')) {
    return 30;
  }

  if (planLower.includes('starter') || planLower === 'business_legacy') {
    return 10;
  }

  return 10;
}

export async function GET() {
  try {
    logger.debug('テナントAPI: リクエスト受信');

    const session = await auth();
    if (!session || !session.user?.id) {
      logger.debug('テナントAPI: 認証されていないアクセス');
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const userId = session.user.id;
    logger.debug('テナントAPI: ユーザーID:', userId);

    try {
      // 🔧 修正: ユーザー情報取得を簡素化
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          subscriptionStatus: true,
          subscription: {
            select: {
              plan: true,
              status: true,
            },
          },
        },
      });

      if (!user) {
        logger.debug('テナントAPI: ユーザーが見つかりません:', userId);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // 永久利用権ユーザーの場合
      if (user.subscriptionStatus === 'permanent') {
        logger.debug('テナントAPI: 永久利用権ユーザー用仮想テナントデータを生成:', userId);

        // 🔧 修正: 実際のテナント検索を簡素化
        let actualTenant = null;
        try {
          actualTenant = await prisma.corporateTenant.findFirst({
            where: {
              OR: [{ adminId: userId }, { users: { some: { id: userId } } }],
            },
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
              onboardingCompleted: true,
              subscriptionId: true,
              _count: {
                select: {
                  users: true,
                  departments: true,
                },
              },
            },
          });
        } catch (tenantError) {
          logger.error('テナントAPI: 実テナント検索エラー:', tenantError);
          // エラーが発生しても仮想テナントで処理を続行
        }

        if (actualTenant) {
          logger.debug('テナントAPI: 実際のテナントデータを使用:', actualTenant.id);

          const responseData = {
            tenant: {
              id: actualTenant.id,
              name: actualTenant.name,
              logoUrl: actualTenant.logoUrl,
              logoWidth: actualTenant.logoWidth,
              logoHeight: actualTenant.logoHeight,
              primaryColor: actualTenant.primaryColor,
              secondaryColor: actualTenant.secondaryColor,
              headerText: actualTenant.headerText,
              textColor: actualTenant.textColor,
              maxUsers: actualTenant.maxUsers,
              accountStatus: actualTenant.accountStatus,
              onboardingCompleted: actualTenant.onboardingCompleted || true,
              userCount: actualTenant._count?.users ?? 1,
              departmentCount: actualTenant._count?.departments ?? 0,
              users: [{ id: userId, name: user.name, role: 'admin' }],
              departments: [], // 部署は空（オプション）
              subscriptionPlan: user.subscription?.plan || 'permanent',
            },
            isAdmin: true,
            userRole: 'admin',
          };

          return NextResponse.json(responseData);
        } else {
          // 仮想テナントを生成
          const virtualTenant = generateVirtualTenantData(userId, user.name);
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
              onboardingCompleted: true,
              userCount: 1,
              departmentCount: virtualTenant.departments.length,
              users: [{ id: userId, name: user.name, role: 'admin' }],
              departments: virtualTenant.departments,
              subscriptionPlan: 'permanent',
            },
            isAdmin: true,
            userRole: 'admin',
          };
          return NextResponse.json(responseData);
        }
      }

      // 🔧 修正: 管理者テナント検索を簡素化
      let adminTenant = null;
      try {
        adminTenant = await prisma.corporateTenant.findUnique({
          where: { adminId: userId },
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
            onboardingCompleted: true,
            subscription: {
              select: {
                plan: true,
                status: true,
              },
            },
            _count: {
              select: {
                users: true,
                departments: true,
              },
            },
          },
        });
      } catch (adminError) {
        logger.error('テナントAPI: 管理者テナント検索エラー:', adminError);
      }

      // 🔧 修正: メンバーテナント検索を簡素化
      let memberTenant = null;
      if (!adminTenant) {
        try {
          memberTenant = await prisma.corporateTenant.findFirst({
            where: {
              users: {
                some: {
                  id: userId,
                },
              },
            },
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
              onboardingCompleted: true,
              subscription: {
                select: {
                  plan: true,
                  status: true,
                },
              },
              _count: {
                select: {
                  users: true,
                  departments: true,
                },
              },
            },
          });
        } catch (memberError) {
          logger.error('テナントAPI: メンバーテナント検索エラー:', memberError);
        }
      }

      const tenant = adminTenant || memberTenant;

      if (!tenant) {
        logger.debug('テナントAPI: テナントが見つかりません:', userId);
        return NextResponse.json(
          {
            error: 'No tenant associated with this user',
            code: 'NO_TENANT',
          },
          { status: 404 },
        );
      }

      // maxUsers修正処理
      const correctMaxUsers = getMaxUsersByPlan(tenant.subscription?.plan ?? null);
      if (tenant.maxUsers !== correctMaxUsers) {
        logger.debug(`テナントAPI: maxUsersを修正: ${tenant.maxUsers} → ${correctMaxUsers}`);
        try {
          await prisma.corporateTenant.update({
            where: { id: tenant.id },
            data: { maxUsers: correctMaxUsers },
          });
          tenant.maxUsers = correctMaxUsers;
        } catch (updateError) {
          logger.error('テナントAPI: maxUsers更新エラー:', updateError);
        }
      }

      const isAdmin = !!adminTenant;
      const userRole = isAdmin ? 'admin' : 'member';

      logger.debug('テナントAPI: テナント情報取得成功:', {
        tenantId: tenant.id,
        isAdmin,
        userRole,
        maxUsers: tenant.maxUsers,
        accountStatus: tenant.accountStatus,
      });

      // アカウント停止状態確認
      if (tenant.accountStatus === 'suspended') {
        return NextResponse.json(
          {
            error: 'Account is suspended',
            tenant: {
              id: tenant.id,
              name: tenant.name,
              accountStatus: 'suspended',
              onboardingCompleted: tenant.onboardingCompleted || false,
            },
            isAdmin,
            userRole,
          },
          { status: 403 },
        );
      }

      // レスポンスデータを作成
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
          onboardingCompleted: tenant.onboardingCompleted || false,
          userCount: tenant._count?.users ?? 0,
          departmentCount: tenant._count?.departments ?? 0,
          users: [],
          departments: [],
          subscriptionPlan: tenant.subscription?.plan,
        },
        isAdmin,
        userRole,
      };

      return NextResponse.json(responseData);
    } catch (dbError) {
      logger.error('テナントAPI: データベースエラー:', dbError);
      return NextResponse.json(
        {
          error: 'Database operation failed',
          details:
            process.env.NODE_ENV === 'development'
              ? dbError instanceof Error
                ? dbError.message
                : String(dbError)
              : undefined,
          code: 'DB_ERROR',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    logger.error('テナントAPI: 全体エラー:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch tenant information',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
        code: 'API_ERROR',
      },
      { status: 500 },
    );
  }
}