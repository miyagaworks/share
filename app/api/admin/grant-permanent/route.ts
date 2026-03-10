// app/api/admin/grant-permanent/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma, disconnectPrisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { PermanentPlanType, PLAN_TYPE_DISPLAY_NAMES } from '@/lib/corporateAccess';
import { isSuperAdmin as isSuperAdminEmail } from '@/lib/auth/constants';
import { getBrandConfig } from '@/lib/brand/config';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    if (!isSuperAdminEmail(session.user.email)) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, planType = 'personal' } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // プラン種別の検証
    const validPlanTypes = ['personal', 'starter', 'business', 'enterprise'];
    if (planType && !validPlanTypes.includes(planType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid plan type',
          validPlanTypes,
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
        adminOfTenant: true,
        subscription: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const isTrialActive = user.trialEndsAt && new Date(user.trialEndsAt) > now;

    if (!isTrialActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'トライアル期間中のユーザーのみに永久利用権を付与できます',
          details: user.trialEndsAt
            ? `トライアル期間は ${new Date(user.trialEndsAt).toLocaleDateString('ja-JP')} に終了しています。`
            : 'このユーザーはトライアル期間が設定されていません。',
        },
        { status: 400 },
      );
    }

    if (user.subscriptionStatus === 'permanent') {
      return NextResponse.json(
        {
          success: false,
          error: 'このユーザーは既に永久利用権を持っています',
        },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. ユーザーに永久利用権を付与
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'permanent',
          trialEndsAt: null,
        },
      });

      logger.info('永久利用権付与', { userId, planType, trialEndsAt: user.trialEndsAt });

      // 2. サブスクリプション作成/更新（テナント作成前に実行）
      let subscription;
      const subscriptionId = `permanent_${userId}_${Date.now()}`;

      if (user.subscription) {
        subscription = await tx.subscription.update({
          where: { userId },
          data: {
            plan: `permanent_${planType}`,
            interval: 'permanent',
            status: 'active',
            subscriptionId: subscriptionId,
          },
        });
      } else {
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 100);

        subscription = await tx.subscription.create({
          data: {
            userId,
            status: 'active',
            plan: `permanent_${planType}`,
            priceId: `price_permanent_${planType}`,
            subscriptionId: subscriptionId,
            currentPeriodStart: now,
            currentPeriodEnd: endDate,
            cancelAtPeriodEnd: false,
            interval: 'permanent',
          },
        });
      }

      // 3. 法人プランの場合のテナント処理（サブスクリプション作成後に実行）
      let tenant: any = null;
      const isCorporatePlan = ['starter', 'business', 'enterprise'].includes(planType);

      if (isCorporatePlan) {
        let maxUsers = 10; // デフォルト（starter）
        if (planType === 'business') {
          maxUsers = 30;
        } else if (planType === 'enterprise') {
          maxUsers = 50;
        }

        if (user.tenant || user.adminOfTenant) {
          // 既存のテナントを更新
          tenant = user.adminOfTenant || user.tenant;
          if (tenant) {
            await tx.corporateTenant.update({
              where: { id: tenant.id },
              data: {
                maxUsers: maxUsers,
                onboardingCompleted: true,
                subscriptionId: subscription.id, // 🔥 修正: 作成されたサブスクリプションのIDを使用
              },
            });
            logger.info('既存テナント更新', { tenantId: tenant.id, maxUsers });
          }
        } else {
          // 新規テナント作成
          tenant = await tx.corporateTenant.create({
            data: {
              name: `${user.name || 'ユーザー'}の法人`,
              maxUsers: maxUsers,
              primaryColor: getBrandConfig().primaryColor,
              secondaryColor: '#60A5FA',
              onboardingCompleted: true,
              subscriptionId: subscription.id, // 🔥 修正: 作成されたサブスクリプションのIDを使用
              adminId: userId,
              departments: {
                create: {
                  name: '全社',
                  description: 'デフォルト部署',
                },
              },
            },
          });

          logger.info('新規テナント作成', { tenantId: tenant.id, planType, maxUsers });

          // ユーザーをテナントのメンバーに設定
          await tx.user.update({
            where: { id: userId },
            data: {
              tenantId: tenant.id,
              corporateRole: 'admin',
            },
          });
        }

        // デフォルトSNSリンクの作成
        if (tenant) {
          const existingSnsLinks = await tx.corporateSnsLink.findMany({
            where: { tenantId: tenant.id },
          });

          if (existingSnsLinks.length === 0) {
            const defaultSnsLinks = [
              { platform: 'line', url: 'https://line.me/ti/p/~', displayOrder: 1 },
              { platform: 'instagram', url: 'https://www.instagram.com/', displayOrder: 2 },
              { platform: 'youtube', url: 'https://www.youtube.com/c/', displayOrder: 3 },
            ];

            for (const snsLink of defaultSnsLinks) {
              await tx.corporateSnsLink.create({
                data: {
                  ...snsLink,
                  tenantId: tenant.id,
                },
              });
            }
            logger.info('デフォルトSNSリンク作成', { tenantId: tenant.id });
          }
        }
      }

      return { user: updatedUser, tenant, subscription };
    });

    // 成功レスポンス
    const planDisplayNames: Record<string, string> = {
      personal: '個人プラン',
      starter: 'スタータープラン (10名まで)',
      business: 'ビジネスプラン (30名まで)',
      enterprise: 'エンタープライズプラン (50名まで)',
    };

    return NextResponse.json({
      success: true,
      message: '永久利用権を付与しました',
      user: {
        id: result.user.id,
        name: result.user.name,
        subscriptionStatus: result.user.subscriptionStatus,
        trialEndsAt: result.user.trialEndsAt,
      },
      planType: planType,
      planName: planDisplayNames[planType] || planType,
      tenant: result.tenant
        ? {
            id: result.tenant.id,
            name: result.tenant.name,
            maxUsers: result.tenant.maxUsers,
            onboardingCompleted: true,
          }
        : null,
    });
  } catch (error) {
    logger.error('永久利用権付与エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  } finally {
    await disconnectPrisma();
  }
}