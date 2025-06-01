// app/api/auth/dashboard-redirect/route.ts (法人ユーザー対応版)
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      logger.debug('認証失敗: セッションなし');
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    const userId = session.user.id;
    logger.debug('ダッシュボードリダイレクト開始', { userId, email: session.user.email });

    // 特定の管理者メールアドレスは管理者ダッシュボードへ
    if (session.user.email === 'admin@sns-share.com') {
      logger.debug('管理者ユーザー: /dashboard/admin にリダイレクト');
      return NextResponse.redirect(new URL('/dashboard/admin', req.url));
    }

    // ユーザーの詳細情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
        corporateRole: true,
        profile: {
          select: {
            slug: true,
            isPublic: true,
          },
        },
        adminOfTenant: {
          select: {
            id: true,
            name: true,
            accountStatus: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            accountStatus: true,
          },
        },
        subscription: {
          select: {
            plan: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      logger.debug('ユーザー未検出: サインインページにリダイレクト');
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // 🚀 新機能: 法人ユーザーの判定とリダイレクト

    // 1. 永久利用権ユーザーの判定
    if (user.subscriptionStatus === 'permanent') {
      logger.debug('永久利用権ユーザー: 法人ダッシュボードにリダイレクト', { userId });
      return NextResponse.redirect(new URL('/dashboard/corporate', req.url));
    }

    // 2. 法人管理者の判定
    const isCorpAdmin = !!user.adminOfTenant;
    if (isCorpAdmin) {
      const tenant = user.adminOfTenant;
      const isTenantActive = tenant?.accountStatus !== 'suspended';

      if (isTenantActive) {
        logger.debug('法人管理者: 法人ダッシュボードにリダイレクト', {
          userId,
          tenantId: tenant?.id,
          tenantName: tenant?.name,
        });
        return NextResponse.redirect(new URL('/dashboard/corporate', req.url));
      } else {
        logger.debug('法人管理者 (停止中テナント): 個人ダッシュボードにリダイレクト', { userId });
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // 3. 法人招待メンバーの判定
    const isInvitedMember = user.corporateRole === 'member' && !!user.tenant;
    if (isInvitedMember) {
      const tenant = user.tenant;
      const isTenantActive = tenant?.accountStatus !== 'suspended';

      if (isTenantActive) {
        logger.debug('法人招待メンバー: 法人メンバーページにリダイレクト', {
          userId,
          tenantId: tenant?.id,
          tenantName: tenant?.name,
        });
        return NextResponse.redirect(new URL('/dashboard/corporate-member', req.url));
      } else {
        logger.debug('法人招待メンバー (停止中テナント): 個人ダッシュボードにリダイレクト', {
          userId,
        });
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // 4. 不完全な招待メンバーの検出
    if (user.corporateRole === 'member' && !user.tenant) {
      logger.warn('不完全な招待メンバーを検出', {
        userId,
        email: user.email,
        corporateRole: user.corporateRole,
      });
      // 不完全な状態でも一旦個人ダッシュボードに送る
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // 5. 個人ユーザーの場合
    logger.debug('個人ユーザー: 個人ダッシュボードにリダイレクト', { userId });
    return NextResponse.redirect(new URL('/dashboard', req.url));
  } catch (error) {
    logger.error('ダッシュボードリダイレクトAPI エラー:', error);
    // エラー時は個人ダッシュボードにフォールバック
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
}