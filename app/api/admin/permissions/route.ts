// app/api/admin/permissions/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminUser } from '@/lib/utils/admin-access-server';
import { addDays } from 'date-fns';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// 統一されたトライアル期間定数（7日間）
const TRIAL_PERIOD_DAYS = 7;

// 永久利用権付与対象かどうかを判定する関数（修正版）
function isEligibleForPermanentAccess(
  user: {
    trialEndsAt: Date | null;
    subscriptionStatus: string | null;
  },
  currentTime: Date = new Date(),
): boolean {
  // 既に永久利用権を持っている場合は対象外
  if (user.subscriptionStatus === 'permanent') {
    return false;
  }

  // トライアル期間が設定されていて、まだ期限内の場合のみ対象
  if (user.trialEndsAt && new Date(user.trialEndsAt) > currentTime) {
    return true;
  }

  return false;
}

// トライアル期間中またはpermanentユーザーかどうかを判定する統一関数（表示用）
function isTrialOrPermanentUser(
  user: {
    trialEndsAt: Date | null;
    subscriptionStatus: string | null;
  },
  currentTime: Date = new Date(),
): boolean {
  // 永久利用権ユーザーは対象
  if (user.subscriptionStatus === 'permanent') {
    return true;
  }

  // トライアル期間が設定されていて、まだ期限内の場合は対象
  if (user.trialEndsAt && new Date(user.trialEndsAt) > currentTime) {
    return true;
  }

  return false;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 管理者チェック
    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 });
    }

    const now = new Date();

    // シンプルな条件でトライアル期間中 + 永久利用権ユーザーを取得
    const users = await prisma.user.findMany({
      where: {
        OR: [
          // 永久利用権ユーザー
          {
            subscriptionStatus: 'permanent',
          },
          // トライアル期間中のユーザー
          {
            AND: [
              {
                trialEndsAt: {
                  gt: now, // トライアル期間がまだ残っている
                },
              },
              {
                subscriptionStatus: {
                  not: 'permanent', // 永久利用権ではない
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        nameKana: true,
        email: true,
        createdAt: true,
        trialEndsAt: true,
        subscriptionStatus: true,
        subscription: {
          select: {
            status: true,
            plan: true,
          },
        },
      },
      orderBy: [
        // 永久利用権ユーザーを先頭に
        { subscriptionStatus: 'desc' },
        // その後はフリガナ順
        { nameKana: 'asc' },
      ],
    });

    // フォーマットしてレスポンス
    const formattedUsers = users.map((user) => {
      const isPermanentUser = user.subscriptionStatus === 'permanent';

      // トライアル期間の残り日数を計算
      let trialDaysRemaining = 0;
      if (user.trialEndsAt && !isPermanentUser) {
        const diffTime = new Date(user.trialEndsAt).getTime() - now.getTime();
        trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        id: user.id,
        name: user.name,
        nameKana: user.nameKana,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        trialEndsAt: user.trialEndsAt?.toISOString() || null,
        trialDaysRemaining,
        isPermanentUser,
        subscriptionStatus: user.subscriptionStatus,
        subscription: user.subscription,
      };
    });

    return NextResponse.json({
      users: formattedUsers,
      totalCount: formattedUsers.length,
      trialUsersCount: formattedUsers.filter((u) => !u.isPermanentUser).length,
      permanentUsersCount: formattedUsers.filter((u) => u.isPermanentUser).length,
    });
  } catch (error) {
    logger.error('永久利用権管理ユーザー一覧取得エラー:', error);
    return NextResponse.json(
      { error: '永久利用権管理ユーザー一覧の取得に失敗しました' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 管理者チェック
    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 });
    }

    // リクエストボディを取得
    const body = await request.json();
    const { userId, isPermanent } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
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
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    const now = new Date();

    if (isPermanent) {
      // 既に永久利用権を持っているかチェック（最初に実行）
      if (user.subscriptionStatus === 'permanent') {
        return NextResponse.json(
          { error: 'このユーザーは既に永久利用権を持っています' },
          { status: 400 },
        );
      }

      // 永久利用権付与対象かチェック（修正された関数を使用）
      if (!isEligibleForPermanentAccess(user, now)) {
        return NextResponse.json(
          {
            error: 'トライアル期間中のユーザーのみに永久利用権を付与できます',
            details: user.trialEndsAt
              ? `トライアル期間は ${new Date(user.trialEndsAt).toLocaleDateString('ja-JP')} に終了しています。`
              : 'このユーザーはトライアル期間が設定されていません。',
          },
          { status: 400 },
        );
      }
    } else {
      // 永久利用権解除時: 永久利用権を持っているかチェック
      if (user.subscriptionStatus !== 'permanent') {
        return NextResponse.json(
          { error: 'このユーザーは永久利用権を持っていません' },
          { status: 400 },
        );
      }
    }

    // トランザクションで永久利用権を付与または解除
    const result = await prisma.$transaction(async (tx) => {
      if (isPermanent) {
        // 永久利用権付与
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: 'permanent',
            trialEndsAt: null, // トライアル期間をクリア
          },
        });

        // サブスクリプション情報を更新または作成
        if (user.subscription) {
          await tx.subscription.update({
            where: { userId },
            data: {
              status: 'active',
              plan: 'permanent',
              interval: 'permanent',
            },
          });
        } else {
          const endDate = new Date();
          endDate.setFullYear(endDate.getFullYear() + 100);

          await tx.subscription.create({
            data: {
              userId,
              status: 'active',
              plan: 'permanent',
              priceId: 'price_permanent',
              subscriptionId: `permanent_${userId}`,
              currentPeriodStart: now,
              currentPeriodEnd: endDate,
              cancelAtPeriodEnd: false,
              interval: 'permanent',
            },
          });
        }

        logger.info('永久利用権付与（管理画面）', { userId, email: user.email });
        return { user: updatedUser, action: 'granted' };
      } else {
        // 永久利用権解除（修正版）
        // 統一されたトライアル期間（7日間）でtrialEndsAtを計算
        const userCreatedAt = new Date(user.createdAt);
        const originalTrialEnd = addDays(userCreatedAt, TRIAL_PERIOD_DAYS); // 7日間に統一
        const isTrialExpired = originalTrialEnd < now;

        let newTrialEndsAt = null;
        if (isTrialExpired) {
          // 元のトライアル期間が過ぎている場合は、猶予期間（7日）を設定
          newTrialEndsAt = addDays(now, TRIAL_PERIOD_DAYS);
        } else {
          // 元のトライアル期間がまだ残っている場合は、元のトライアル期間を復元
          newTrialEndsAt = originalTrialEnd;
        }

        // Step 1: 法人テナントの管理者の場合の詳細なクリーンアップ
        if (user.adminOfTenant) {
          const tenantId = user.adminOfTenant.id;

          // 1.1 テナントの他のメンバーを確認
          const otherMembers = await tx.user.findMany({
            where: {
              tenantId: tenantId,
              id: { not: userId },
            },
          });

          // 1.2 CorporateSnsLinkを削除
          await tx.corporateSnsLink.deleteMany({
            where: { tenantId: tenantId },
          });

          // 1.3 Departmentを削除
          await tx.department.deleteMany({
            where: { tenantId: tenantId },
          });

          // 1.4 他のメンバーのテナント関連付けを解除
          if (otherMembers.length > 0) {
            await tx.user.updateMany({
              where: {
                tenantId: tenantId,
                id: { not: userId },
              },
              data: {
                tenantId: null,
                corporateRole: null,
                departmentId: null,
              },
            });
          }

          // 1.5 CorporateTenantを削除（最後に実行）
          await tx.corporateTenant.delete({
            where: { id: tenantId },
          });

          logger.info('永久利用権解除: テナント削除完了', {
            tenantId,
            otherMembersCount: otherMembers.length,
          });
        }

        // Step 2: ユーザーのテナント関連付けを解除
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: 'trialing', // trialingステータスに戻す
            trialEndsAt: newTrialEndsAt,
            corporateRole: null,
            departmentId: null,
            // tenantIdは上記のテナント削除で自動的にnullになる
          },
        });

        // Step 3: サブスクリプション情報を削除
        if (user.subscription) {
          await tx.subscription.delete({
            where: { userId },
          });
          logger.info('永久利用権解除: サブスクリプション削除完了', { userId });
        }

        logger.info('永久利用権解除完了', {
          userId,
          email: user.email,
          isTrialExpired,
          originalTrialEnd: originalTrialEnd.toISOString(),
          newTrialEndsAt: newTrialEndsAt?.toISOString(),
          hadTenant: !!user.adminOfTenant,
        });

        return {
          user: updatedUser,
          action: 'revoked',
          isTrialExpired,
          trialEndsAt: newTrialEndsAt,
        };
      }
    });

    // レスポンス
    const responseData: any = {
      success: true,
      message: isPermanent ? '永久利用権を付与しました' : '永久利用権を解除しました',
      user: {
        id: result.user.id,
        email: result.user.email,
        subscriptionStatus: result.user.subscriptionStatus,
        trialEndsAt: result.user.trialEndsAt,
      },
    };

    // 解除時の追加情報
    if (!isPermanent) {
      responseData.isTrialExpired = result.isTrialExpired;
      if (result.isTrialExpired) {
        responseData.warning = `元のトライアル期間が既に終了していたため、${TRIAL_PERIOD_DAYS}日間の猶予期間を設定しました。`;
      }
    }

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('永久利用権の更新エラー:', error);
    return NextResponse.json({ error: '永久利用権の更新に失敗しました' }, { status: 500 });
  }
}