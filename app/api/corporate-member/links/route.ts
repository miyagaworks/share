// app/api/corporate-member/links/route.ts (修正版 - 型エラー完全解決)
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { CorporateSnsLink, SnsLink, CustomLink } from '@prisma/client';

// 型定義を明示的に定義
type CorporateSnsLinkSelect = Pick<
  CorporateSnsLink,
  'id' | 'platform' | 'username' | 'url' | 'displayOrder' | 'isRequired'
>;
type PersonalSnsLinkSelect = Pick<SnsLink, 'id' | 'platform' | 'username' | 'url' | 'displayOrder'>;
type CustomLinkSelect = Pick<CustomLink, 'id' | 'name' | 'url' | 'displayOrder'>;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    logger.debug('法人メンバーリンク API: 開始', { userId: session.user.id });

    try {
      // 🔧 修正: ユーザー情報取得を段階的に実行
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          subscriptionStatus: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
      }

      // 🔧 修正: テナント情報を個別に取得
      let tenantInfo = null;
      try {
        const userWithTenant = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            tenant: {
              select: {
                id: true,
                name: true,
                primaryColor: true,
                secondaryColor: true,
              },
            },
            adminOfTenant: {
              select: {
                id: true,
                name: true,
                primaryColor: true,
                secondaryColor: true,
              },
            },
          },
        });

        tenantInfo = userWithTenant?.adminOfTenant || userWithTenant?.tenant;
      } catch (tenantError) {
        logger.error('法人メンバーリンク API: テナント取得エラー:', tenantError);
        // テナント情報が取得できなくても続行
      }

      if (!tenantInfo) {
        return NextResponse.json({ error: 'テナント情報が見つかりません' }, { status: 404 });
      }

      // 🔧 修正: 法人SNSリンクを個別に取得（型alias使用）
      let corporateSnsLinks: CorporateSnsLinkSelect[] = [];
      try {
        corporateSnsLinks = await prisma.corporateSnsLink.findMany({
          where: { tenantId: tenantInfo.id },
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
        });
      } catch (corpSnsError) {
        logger.error('法人メンバーリンク API: 法人SNS取得エラー:', corpSnsError);
        // エラーが発生しても空配列で続行
      }

      // 🔧 修正: 個人SNSリンクを個別に取得（型alias使用）
      let personalSnsLinks: PersonalSnsLinkSelect[] = [];
      try {
        personalSnsLinks = await prisma.snsLink.findMany({
          where: { userId: session.user.id },
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
        });
      } catch (personalSnsError) {
        logger.error('法人メンバーリンク API: 個人SNS取得エラー:', personalSnsError);
        // エラーが発生しても空配列で続行
      }

      // 🔧 修正: カスタムリンクを個別に取得
      let customLinks: CustomLinkSelect[] = [];
      try {
        customLinks = await prisma.customLink.findMany({
          where: { userId: session.user.id },
          select: {
            id: true,
            name: true,
            url: true,
            displayOrder: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        });
      } catch (customError) {
        logger.error('法人メンバーリンク API: カスタムリンク取得エラー:', customError);
        // エラーが発生しても空配列で続行
      }

      // 法人カラー情報
      const corporateColors = {
        primaryColor: tenantInfo.primaryColor || '#3B82F6',
        secondaryColor: tenantInfo.secondaryColor || '#1E40AF',
      };

      logger.debug('法人メンバーリンク API: 成功', {
        tenantId: tenantInfo.id,
        corpSnsCount: corporateSnsLinks.length,
        personalSnsCount: personalSnsLinks.length,
        customCount: customLinks.length,
      });

      return NextResponse.json({
        success: true,
        corporateSnsLinks,
        personalSnsLinks,
        customLinks,
        corporateColors,
        tenant: {
          id: tenantInfo.id,
          name: tenantInfo.name,
          primaryColor: tenantInfo.primaryColor,
          secondaryColor: tenantInfo.secondaryColor,
        },
      });
    } catch (dbError) {
      logger.error('法人メンバーリンク API: データベースエラー:', dbError);

      return NextResponse.json(
        {
          success: false,
          error: 'リンク情報の取得に失敗しました',
          corporateSnsLinks: [] as CorporateSnsLinkSelect[],
          personalSnsLinks: [] as PersonalSnsLinkSelect[],
          customLinks: [] as CustomLinkSelect[],
          corporateColors: {
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF',
          },
          tenant: null,
          details:
            process.env.NODE_ENV === 'development'
              ? dbError instanceof Error
                ? dbError.message
                : String(dbError)
              : undefined,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    logger.error('法人メンバーリンク API: 全体エラー:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'リンク情報の取得に失敗しました',
        corporateSnsLinks: [] as CorporateSnsLinkSelect[],
        personalSnsLinks: [] as PersonalSnsLinkSelect[],
        customLinks: [] as CustomLinkSelect[],
        corporateColors: {
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
        },
        tenant: null,
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 },
    );
  }
}