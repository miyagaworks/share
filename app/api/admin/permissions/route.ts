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

// 🔥 新規追加: GET - トライアル期間中のユーザー一覧を取得
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

    // トライアル期間中のユーザー + 永久利用権ユーザーを取得
    const users = await prisma.user.findMany({
      where: {
        OR: [
          // トライアル期間中のユーザー
          {
            trialEndsAt: {
              gt: now, // トライアル期間がまだ残っている
            },
            subscriptionStatus: {
              not: 'permanent', // 永久利用権ではない
            },
          },
          // 永久利用権ユーザー
          {
            subscriptionStatus: 'permanent',
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
      // 🔥 永久利用権付与時: トライアル期間中かチェック
      const isTrialActive = user.trialEndsAt && new Date(user.trialEndsAt) > now;

      if (!isTrialActive) {
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

      // 既に永久利用権を持っているかチェック
      if (user.subscriptionStatus === 'permanent') {
        return NextResponse.json(
          { error: 'このユーザーは既に永久利用権を持っています' },
          { status: 400 },
        );
      }
    } else {
      // 🔥 永久利用権解除時: 永久利用権を持っているかチェック
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
        // 🔥 永久利用権付与
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
        // 🔥 永久利用権解除
        // トライアル期間が既に過ぎているかチェック
        const originalTrialEnd = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
        const isTrialExpired = !originalTrialEnd || originalTrialEnd < now;

        let newTrialEndsAt = null;
        if (isTrialExpired) {
          // トライアル期間が過ぎている場合は、猶予期間（7日）を設定
          newTrialEndsAt = addDays(now, 7);
        } else {
          // トライアル期間がまだ残っている場合は、元のトライアル期間を復元
          newTrialEndsAt = originalTrialEnd;
        }

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: null,
            trialEndsAt: newTrialEndsAt,
          },
        });

        // サブスクリプション情報を削除または更新
        if (user.subscription) {
          // 🔥 永久利用権のサブスクリプションは削除
          await tx.subscription.delete({
            where: { userId },
          });
          logger.info('永久利用権サブスクリプション削除', { userId });
        }

        // 法人テナント関連のクリーンアップ
        if (user.adminOfTenant) {
          // 管理者の場合、テナントとの関連を解除
          await tx.user.update({
            where: { id: userId },
            data: {
              corporateRole: null,
              tenantId: null,
            },
          });

          // テナントを削除（他にユーザーがいない場合）
          const otherTenantUsers = await tx.user.findMany({
            where: {
              tenantId: user.adminOfTenant.id,
              id: { not: userId },
            },
          });

          if (otherTenantUsers.length === 0) {
            // 他にユーザーがいない場合、テナントを削除
            await tx.corporateTenant.delete({
              where: { id: user.adminOfTenant.id },
            });
            logger.info('空のテナント削除', { tenantId: user.adminOfTenant.id });
          }
        }

        logger.info('永久利用権解除（管理画面）', {
          userId,
          email: user.email,
          isTrialExpired,
          newTrialEndsAt,
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
        responseData.warning =
          '元のトライアル期間が既に終了していたため、7日間の猶予期間を設定しました。';
      }
    }

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('永久利用権の更新エラー:', error);
    return NextResponse.json({ error: '永久利用権の更新に失敗しました' }, { status: 500 });
  }
}