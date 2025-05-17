// app/api/admin/grant-permanent/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma, disconnectPrisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

export async function POST(request: Request) {
  try {
    // 管理者認証チェック
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // 管理者かどうかを確認する処理
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    // 管理者以外はアクセス不可
    if (!admin || admin.email !== 'admin@sns-share.com') {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    // リクエストボディからユーザーIDを取得
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // ユーザーが存在するか確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
        adminOfTenant: true,
        subscription: true, // サブスクリプション情報も取得
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // トランザクションで処理を実行
    const result = await prisma.$transaction(async (tx) => {
      // 1. ユーザーに永久利用権を付与
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'permanent',
        },
      });

      // 2. 仮想テナントがまだ存在しない場合は作成
      let tenant = null;

      // 既存のテナント関連付けがあるかチェック
      if (user.tenant || user.adminOfTenant) {
        // 既存のテナント関連を使用
        tenant = user.adminOfTenant || user.tenant;
        logger.info('既存テナント使用', { tenantId: tenant?.id || 'unknown' });
      } else {
        // 仮想テナントを新規作成
        tenant = await tx.corporateTenant.create({
          data: {
            name: `${user.name || 'ユーザー'}の法人`,
            maxUsers: 50, // business_plusの上限値
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

        logger.info('新規テナント作成', { tenantId: tenant.id });

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
        logger.error('テナント作成失敗', { userId });
        return { user: updatedUser, tenant: null };
      }

      // サブスクリプション情報を更新（存在する場合）
      if (user.subscription) {
        await tx.subscription.update({
          where: { userId },
          data: {
            plan: 'business_plus', // プランをbusiness_plusに変更
          },
        });
      } else {
        // サブスクリプション情報がない場合は新規作成
        const now = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 100); // 100年後（実質永久）

        await tx.subscription.create({
          data: {
            userId,
            status: 'active',
            plan: 'business_plus',
            priceId: 'price_permanent',
            subscriptionId: `permanent_${userId}`,
            currentPeriodStart: now,
            currentPeriodEnd: endDate,
            cancelAtPeriodEnd: false,
          },
        });
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

      return { user: updatedUser, tenant };
    });

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      message: '永久利用権を付与し、法人データを設定しました',
      user: {
        id: result.user.id,
        name: result.user.name,
        subscriptionStatus: result.user.subscriptionStatus,
      },
      tenant: result.tenant
        ? {
            id: result.tenant.id,
            name: result.tenant.name,
          }
        : null,
    });
  } catch (error) {
    console.error('永久利用権付与エラー:', error);
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