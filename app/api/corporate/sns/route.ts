// app/api/corporate/sns/route.ts (修正版 - 型エラー完全解決)
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { SNS_PLATFORMS } from '@/types/sns';
import type { CorporateSnsLink } from '@prisma/client';

// 仮想テナントデータを生成する関数（依存関係を削減）
function generateVirtualSnsData() {
  return {
    snsLinks: [
      {
        id: 'virtual-twitter',
        platform: 'twitter',
        username: 'example',
        url: 'https://twitter.com/example',
        displayOrder: 1,
        isRequired: false,
      },
    ],
  };
}

// 法人共通SNSリンクの取得
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    logger.debug('法人SNS API: 開始', { userId: session.user.id });

    try {
      // 🔧 修正: ユーザー情報取得を簡素化
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          subscriptionStatus: true,
          adminOfTenant: {
            select: {
              id: true,
              name: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
      }

      // 🔧 修正: 永久利用権ユーザーの処理を簡素化
      if (user.subscriptionStatus === 'permanent') {
        logger.debug('法人SNS API: 永久利用権ユーザー');
        const virtualData = generateVirtualSnsData();
        return NextResponse.json({
          success: true,
          snsLinks: virtualData.snsLinks,
          isAdmin: true,
        });
      }

      // テナント情報を取得
      const tenant = user.adminOfTenant || user.tenant;
      if (!tenant) {
        return NextResponse.json({ error: '法人テナント情報が見つかりません' }, { status: 404 });
      }

      // 🔧 修正: SNSリンク取得を簡素化（型指定）
      let snsLinks: CorporateSnsLink[] = [];
      try {
        snsLinks = await prisma.corporateSnsLink.findMany({
          where: { tenantId: tenant.id },
          orderBy: { displayOrder: 'asc' },
        });
      } catch (snsError) {
        logger.error('法人SNS API: SNSリンク取得エラー:', snsError);
        // エラーが発生しても空配列で続行
      }

      logger.debug('法人SNS API: 成功', {
        tenantId: tenant.id,
        snsCount: snsLinks.length,
        isAdmin: !!user.adminOfTenant,
      });

      return NextResponse.json({
        success: true,
        snsLinks,
        isAdmin: !!user.adminOfTenant,
      });
    } catch (dbError) {
      logger.error('法人SNS API: データベースエラー:', dbError);

      // 🔧 修正: フォールバック処理（型指定）
      return NextResponse.json(
        {
          success: false,
          error: '法人共通SNSリンクの取得に失敗しました',
          snsLinks: [] as CorporateSnsLink[],
          isAdmin: false,
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
    logger.error('法人SNS API: 全体エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: '法人共通SNSリンクの取得に失敗しました',
        snsLinks: [] as CorporateSnsLink[],
        isAdmin: false,
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

// 法人共通SNSリンクの追加
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // リクエストボディの取得
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'リクエストボディが無効です' }, { status: 400 });
    }

    // 🔧 修正: 管理者権限確認を簡素化
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          subscriptionStatus: true,
          adminOfTenant: {
            select: {
              id: true,
            },
          },
        },
      });
    } catch (userError) {
      logger.error('法人SNS POST: ユーザー取得エラー:', userError);
      return NextResponse.json({ error: 'ユーザー情報の取得に失敗しました' }, { status: 500 });
    }

    // 永久利用権ユーザーの場合
    if (user?.subscriptionStatus === 'permanent') {
      return NextResponse.json({
        success: true,
        message: '永久利用権ユーザーのSNSリンクは更新されません',
        link: {
          id: `virtual-sns-${Date.now()}`,
          platform: body.platform,
          username: body.username || null,
          url: body.url,
          displayOrder: 999,
          isRequired: body.isRequired || false,
        },
      });
    }

    if (!user || !user.adminOfTenant) {
      return NextResponse.json({ error: 'この操作には管理者権限が必要です' }, { status: 403 });
    }

    // 🔧 修正: バリデーションを簡素化
    if (!body.platform || !body.url) {
      return NextResponse.json({ error: 'プラットフォームとURLは必須です' }, { status: 400 });
    }

    try {
      // プラットフォーム重複確認
      const existingLink = await prisma.corporateSnsLink.findFirst({
        where: {
          tenantId: user.adminOfTenant.id,
          platform: body.platform,
        },
      });

      if (existingLink) {
        return NextResponse.json(
          { error: 'このプラットフォームは既に追加されています' },
          { status: 400 },
        );
      }

      // 表示順を決定
      const currentLinks = await prisma.corporateSnsLink.findMany({
        where: { tenantId: user.adminOfTenant.id },
      });
      const displayOrder = currentLinks.length + 1;

      // SNSリンクを追加
      const newLink = await prisma.corporateSnsLink.create({
        data: {
          tenantId: user.adminOfTenant.id,
          platform: body.platform,
          username: body.username || null,
          url: body.url,
          displayOrder,
          isRequired: body.isRequired || false,
        },
      });

      return NextResponse.json({
        success: true,
        link: newLink,
      });
    } catch (createError) {
      logger.error('法人SNS POST: 作成エラー:', createError);
      return NextResponse.json({ error: 'SNSリンクの追加に失敗しました' }, { status: 500 });
    }
  } catch (error) {
    logger.error('法人SNS POST: 全体エラー:', error);
    return NextResponse.json({ error: '法人共通SNSリンクの追加に失敗しました' }, { status: 500 });
  }
}

// パッチメソッド（一括更新）
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // リクエストボディの取得
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'リクエストボディが無効です' }, { status: 400 });
    }

    // 🔧 修正: 管理者権限確認を簡素化
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        subscriptionStatus: true,
        adminOfTenant: {
          select: {
            id: true,
          },
        },
      },
    });

    // 永久利用権ユーザーの場合
    if (user?.subscriptionStatus === 'permanent') {
      return NextResponse.json({
        success: true,
        message: '永久利用権ユーザーのSNSリンク設定は更新されません',
      });
    }

    if (!user || !user.adminOfTenant) {
      return NextResponse.json({ error: 'この操作には管理者権限が必要です' }, { status: 403 });
    }

    const { operation, data } = body;

    if (operation === 'reorder' && Array.isArray(data)) {
      // リンクの並び替え
      try {
        await prisma.$transaction(
          data.map((id: string, index: number) =>
            prisma.corporateSnsLink.update({
              where: { id },
              data: { displayOrder: index + 1 },
            }),
          ),
        );

        return NextResponse.json({
          success: true,
          message: '表示順を更新しました',
        });
      } catch (reorderError) {
        logger.error('法人SNS PATCH: 並び替えエラー:', reorderError);
        return NextResponse.json({ error: '表示順の更新に失敗しました' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: '無効な操作です' }, { status: 400 });
  } catch (error) {
    logger.error('法人SNS PATCH: 全体エラー:', error);
    return NextResponse.json({ error: '法人共通SNSリンクの更新に失敗しました' }, { status: 500 });
  }
}