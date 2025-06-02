// app/api/admin/grant-permanent/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma, disconnectPrisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { PermanentPlanType, PLAN_TYPE_DISPLAY_NAMES } from '@/lib/corporateAccess';

export async function POST(request: Request) {
  try {
    // 管理者認証チェック
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // 管理者かどうかを確認（スーパー管理者のみ許可）
    if (session.user.email !== 'admin@sns-share.com') {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    // リクエストボディからユーザーIDとプラン種別を取得
    const body = await request.json();
    const { userId, planType = PermanentPlanType.PERSONAL } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // プラン種別の検証
    if (planType && !Object.values(PermanentPlanType).includes(planType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid plan type',
          validPlanTypes: Object.values(PermanentPlanType),
        },
        { status: 400 },
      );
    }

    // ユーザーが存在するか確認
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

    // 🔥 新規追加: トライアル期間中かどうかをチェック
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

    // 🔥 新規追加: 既に永久利用権を持っているかチェック
    if (user.subscriptionStatus === 'permanent') {
      return NextResponse.json(
        {
          success: false,
          error: 'このユーザーは既に永久利用権を持っています',
        },
        { status: 400 },
      );
    }

    // トランザクションで処理を実行
    const result = await prisma.$transaction(async (tx) => {
      // 1. ユーザーに永久利用権を付与
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'permanent',
          // 🔥 新規追加: トライアル期間をクリア（永久利用権なので不要）
          trialEndsAt: null,
        },
      });

      // 永久利用権付与をログに記録
      logger.info('永久利用権付与', { userId, planType, trialEndsAt: user.trialEndsAt });

      // 3. 仮想テナントがまだ存在しない場合は作成
      // プラン種別が法人向けの場合のみテナントを作成
      let tenant = null;
      const isCorporatePlan = [
        PermanentPlanType.BUSINESS,
        PermanentPlanType.BUSINESS_PLUS,
        PermanentPlanType.ENTERPRISE,
      ].includes(planType as PermanentPlanType);

      // 法人向けプランの場合のみテナント作成処理
      if (isCorporatePlan) {
        // 既存のテナント関連付けがあるかチェック
        if (user.tenant || user.adminOfTenant) {
          // 既存のテナント関連を使用
          tenant = user.adminOfTenant || user.tenant;
          logger.info('既存テナント使用', { tenantId: tenant?.id || 'unknown' });
        } else {
          // プラン種別に応じたユーザー数上限を設定
          let maxUsers = 10; // デフォルト（BUSINESS）
          if (planType === PermanentPlanType.BUSINESS_PLUS) {
            maxUsers = 30;
          } else if (planType === PermanentPlanType.ENTERPRISE) {
            maxUsers = 50;
          }

          // 仮想テナントを新規作成
          tenant = await tx.corporateTenant.create({
            data: {
              name: `${user.name || 'ユーザー'}の法人`,
              maxUsers: maxUsers,
              primaryColor: '#3B82F6',
              secondaryColor: '#60A5FA',
              admin: { connect: { id: userId } },
              // デフォルト部署も作成
              departments: {
                create: {
                  name: '全社',
                  description: 'デフォルト部署',
                },
              },
            },
          });

          logger.info('新規テナント作成', { tenantId: tenant.id, planType, maxUsers });

          // ユーザーを作成したテナントのメンバーにする
          await tx.user.update({
            where: { id: userId },
            data: {
              tenant: { connect: { id: tenant.id } },
              corporateRole: 'admin',
            },
          });
        }

        // エラー回避：tenant が null の場合はここで処理を終了
        if (!tenant) {
          logger.error('テナント作成失敗', { userId, planType });
          return { user: updatedUser, tenant: null };
        }

        // 3. デフォルトのSNSリンク設定を作成（まだ存在しない場合）
        const existingSnsLinks = await tx.corporateSnsLink.findMany({
          where: { tenantId: tenant.id },
        });

        // デフォルトSNSがまだない場合は作成
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
                tenant: { connect: { id: tenant.id } },
              },
            });
          }
          logger.info('デフォルトSNSリンク作成', { tenantId: tenant.id });
        }
      }

      // 4. サブスクリプション情報を更新（存在する場合）
      let subscription = null;
      if (user.subscription) {
        subscription = await tx.subscription.update({
          where: { userId },
          data: {
            plan: 'permanent',
            interval: 'permanent',
            status: 'active', // 🔥 追加: ステータスを確実にactiveに
          },
        });
      } else {
        // サブスクリプション情報がない場合は新規作成
        const now = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 100); // 100年後（実質永久）

        subscription = await tx.subscription.create({
          data: {
            userId,
            status: 'active',
            plan: `permanent_${planType}`, // 🔥 プラン種別を含めて保存
            priceId: `price_permanent_${planType}`,
            subscriptionId: `permanent_${userId}`,
            currentPeriodStart: now,
            currentPeriodEnd: endDate,
            cancelAtPeriodEnd: false,
            interval: 'permanent',
          },
        });
      }

      return { user: updatedUser, tenant, subscription };
    });

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      message: '永久利用権を付与しました',
      user: {
        id: result.user.id,
        name: result.user.name,
        subscriptionStatus: result.user.subscriptionStatus,
        trialEndsAt: result.user.trialEndsAt, // 🔥 追加: トライアル期間情報も返す
      },
      planType: planType,
      planName: PLAN_TYPE_DISPLAY_NAMES[planType as PermanentPlanType],
      tenant: result.tenant
        ? {
            id: result.tenant.id,
            name: result.tenant.name,
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