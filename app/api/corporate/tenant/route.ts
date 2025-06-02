// app/api/corporate/tenant/route.ts (修正版)
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generateVirtualTenantData } from '@/lib/corporateAccess';
// プランに応じたmaxUsersを取得する関数（修正版）
function getMaxUsersByPlan(plan: string | null | undefined): number {
  if (!plan) return 10;
  const planLower = plan.toLowerCase();

  // エンタープライズプラン: 50ユーザー
  if (planLower.includes('enterprise')) {
    return 50;
  }

  // ビジネスプラン: 30ユーザー（旧business_plusも含む）
  if (planLower.includes('business') && !planLower.includes('starter')) {
    return 30;
  }

  // 🔥 旧プラン名の互換性対応
  if (planLower.includes('business_plus') || planLower.includes('businessplus')) {
    return 30;
  }

  // スタータープラン: 10ユーザー
  if (planLower.includes('starter') || planLower === 'business_legacy') {
    return 10;
  }

  return 10; // デフォルト
}
export async function GET() {
  try {
    logger.debug('[API] /api/corporate/tenant リクエスト受信');
    // セッション認証チェック
    const session = await auth();
    if (!session || !session.user?.id) {
      logger.debug('[API] 認証されていないアクセス');
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }
    const userId = session.user.id;
    logger.debug('[API] ユーザーID:', userId);
    try {
      // ユーザー情報を取得
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          subscriptionStatus: true,
        },
      });
      // ユーザーが見つからない場合
      if (!user) {
        logger.debug('[API] ユーザーが見つかりません:', userId);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      // 永久利用権ユーザーの場合、仮想テナントデータを生成して返す
      if (user.subscriptionStatus === 'permanent') {
        logger.debug('[API] 永久利用権ユーザー用仮想テナントデータを生成:', userId);
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
            maxUsers: 50, // 永久利用権は50ユーザー
            accountStatus: 'active',
            onboardingCompleted: true,
            userCount: 1,
            departmentCount: virtualTenant.departments.length,
            users: [{ id: userId, name: user.name, role: 'admin' }],
            departments: virtualTenant.departments,
            subscriptionPlan: 'permanent', // 永久利用権を明示
          },
          isAdmin: true,
          userRole: 'admin',
        };
        return NextResponse.json(responseData);
      }
      // 管理者としてのテナントを検索（サブスクリプション情報も含む）
      const adminTenant = await prisma.corporateTenant.findUnique({
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
      // 一般メンバーとしてのテナントを検索
      const memberTenant = !adminTenant
        ? await prisma.corporateTenant.findFirst({
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
          })
        : null;
      // テナント情報を取得（管理者または一般メンバー）
      const tenant = adminTenant || memberTenant;
      // テナントが見つからない場合
      if (!tenant) {
        logger.debug('[API] テナントが見つかりません:', userId);
        return NextResponse.json({ error: 'No tenant associated with this user' }, { status: 404 });
      }
      // プランに基づいてmaxUsersを動的に計算
      const correctMaxUsers = getMaxUsersByPlan(tenant.subscription?.plan ?? null);
      logger.debug('[API] プラン解析:', {
        originalPlan: tenant.subscription?.plan,
        calculatedMaxUsers: correctMaxUsers,
        currentMaxUsers: tenant.maxUsers,
      });
      // データベースのmaxUsersが間違っている場合は修正
      if (tenant.maxUsers !== correctMaxUsers) {
        logger.debug(
          `[API] maxUsersを修正: ${tenant.maxUsers} → ${correctMaxUsers} (プラン: ${tenant.subscription?.plan})`,
        );
        try {
          await prisma.corporateTenant.update({
            where: { id: tenant.id },
            data: { maxUsers: correctMaxUsers },
          });
          // レスポンス用に修正された値を使用
          tenant.maxUsers = correctMaxUsers;
          logger.debug('[API] maxUsers更新完了');
        } catch (updateError) {
          logger.error('[API] maxUsers更新エラー:', updateError);
          // エラーが発生しても処理を続行
        }
      }
      // 管理者権限の確認
      const isAdmin = !!adminTenant;
      const userRole = isAdmin ? 'admin' : 'member';
      logger.debug('[API] テナント情報取得成功:', {
        tenantId: tenant.id,
        isAdmin,
        userRole,
        maxUsers: tenant.maxUsers,
        plan: tenant.subscription?.plan,
        onboardingCompleted: tenant.onboardingCompleted,
      });
      // アカウント停止状態確認
      if (tenant.accountStatus === 'suspended') {
        logger.debug('[API] テナントは停止状態です:', tenant.id);
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
          maxUsers: tenant.maxUsers, // 修正された値を使用
          accountStatus: tenant.accountStatus,
          onboardingCompleted: tenant.onboardingCompleted || false,
          userCount: tenant._count?.users ?? 0,
          departmentCount: tenant._count?.departments ?? 0,
          users: [],
          departments: [],
          // デバッグ情報を追加
          subscriptionPlan: tenant.subscription?.plan,
        },
        isAdmin,
        userRole,
      };
      return NextResponse.json(responseData);
    } catch (dbError) {
      logger.error('[API] データベースエラー:', dbError);
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
    logger.error('[API] テナント情報取得エラー:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch tenant information',
        details: errorMessage,
        code: 'API_ERROR',
      },
      { status: 500 },
    );
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {
      logger.error('[API] Prisma切断エラー:', e);
    }
  }
}