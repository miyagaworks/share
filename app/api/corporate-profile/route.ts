// app/api/corporate-profile/route.ts (型エラー完全解決版)
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { CorporateSnsLink } from '@prisma/client';

export async function GET() {
  try {
    logger.debug('🚀 Corporate Profile API開始');

    const session = await auth();
    if (!session?.user?.id) {
      logger.debug('❌ 認証なし');
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    logger.debug('✅ セッション確認完了:', { userId: session.user.id });

    // ユーザー情報とテナント情報を取得
    let userData;
    try {
      userData = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          profile: true,
          department: true,
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
              accountStatus: true,
            },
          },
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

      logger.debug('✅ ユーザーデータ取得完了:', {
        userId: session.user.id,
        hasUser: !!userData,
        hasTenant: !!userData?.tenant,
        hasAdminTenant: !!userData?.adminOfTenant,
      });
    } catch (dbError) {
      logger.error('❌ ユーザーデータ取得エラー:', dbError);
      return NextResponse.json(
        {
          error: 'ユーザー情報の取得に失敗しました',
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

    if (!userData) {
      logger.debug('❌ ユーザーが見つかりません');
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // テナント情報（管理者または一般メンバーのいずれか）
    const tenantData = userData.adminOfTenant || userData.tenant;
    const isAdmin = !!userData.adminOfTenant;
    const isMember = !!userData.tenant && !isAdmin;

    logger.debug('🔍 テナント情報:', {
      hasTenant: !!tenantData,
      isAdmin,
      isMember,
      tenantId: tenantData?.id,
    });

    // 一般ユーザー（テナントなし）の場合の処理
    if (!tenantData) {
      logger.debug('📝 一般ユーザーとして処理');

      const response = {
        success: true,
        data: {
          user: {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            image: userData.image,
          },
          profile: userData.profile,
          tenant: null,
          corporateSnsLinks: [] as CorporateSnsLink[],
          isAdmin: false,
          isMember: false,
          department: null,
          message: '法人プランに加入していません',
        },
      };

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          Pragma: 'no-cache',
        },
      });
    }

    // 🔧 修正: 企業SNSリンクを取得（型指定）
    let corporateSnsLinks: CorporateSnsLink[] = [];
    try {
      corporateSnsLinks = await prisma.corporateSnsLink.findMany({
        where: {
          tenantId: tenantData.id,
        },
        orderBy: {
          displayOrder: 'asc',
        },
      });

      logger.debug('✅ 企業SNSリンク取得完了:', { count: corporateSnsLinks.length });
    } catch (snsError) {
      logger.error('⚠️ 企業SNSリンク取得エラー（続行）:', snsError);
      // SNSリンクの取得に失敗しても、他のデータは返す
      corporateSnsLinks = [];
    }

    // レスポンス構築
    const response = {
      success: true,
      data: {
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          image: userData.image,
        },
        profile: userData.profile,
        tenant: {
          id: tenantData.id,
          name: tenantData.name,
          logoUrl: tenantData.logoUrl,
          logoWidth: tenantData.logoWidth,
          logoHeight: tenantData.logoHeight,
          primaryColor: tenantData.primaryColor,
          secondaryColor: tenantData.secondaryColor,
          headerText: tenantData.headerText,
          textColor: tenantData.textColor,
          accountStatus: tenantData.accountStatus,
        },
        corporateSnsLinks,
        isAdmin,
        isMember,
        department: userData.department,
      },
    };

    logger.debug('✅ Corporate Profile API成功');

    // レスポンス返却
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        Pragma: 'no-cache',
      },
    });
  } catch (error) {
    logger.error('❌ Corporate Profile API全体エラー:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: '企業プロフィール情報の取得に失敗しました',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}