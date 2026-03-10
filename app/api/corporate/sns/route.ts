// app/api/corporate/sns/route.ts (接続エラー修正版)
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma, safeQuery } from '@/lib/prisma';
import { SNS_PLATFORMS } from '@/types/sns';
import type { CorporateSnsLink } from '@prisma/client';

// 法人共通SNSリンクの取得
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    logger.debug('法人SNS API: 開始', { userId: session.user.id });

    try {
      // 🔧 修正: ensurePrismaConnection()を削除し、直接クエリ実行
      const user = await safeQuery(async () => {
        return await prisma.user.findUnique({
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
      });

      if (!user) {
        return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
      }

      // テナント情報を取得
      const tenant = user.adminOfTenant || user.tenant;
      if (!tenant) {
        return NextResponse.json({ error: '法人テナント情報が見つかりません' }, { status: 404 });
      }

      // safeQueryを使用してSNSリンク取得
      let snsLinks: CorporateSnsLink[] = [];
      try {
        snsLinks = await safeQuery(async () => {
          return await prisma.corporateSnsLink.findMany({
            where: { tenantId: tenant.id },
            orderBy: { displayOrder: 'asc' },
          });
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

      // 🔧 修正: より具体的なエラー情報を提供
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      const isConnectionError =
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('Engine is not yet connected');

      if (isConnectionError) {
        logger.error('法人SNS API: データベース接続問題を検出');
      }

      return NextResponse.json(
        {
          success: false,
          error: '法人共通SNSリンクの取得に失敗しました',
          snsLinks: [] as CorporateSnsLink[],
          isAdmin: false,
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
          connectionIssue: isConnectionError,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    logger.error('法人SNS API: 全体エラー:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        success: false,
        error: '法人共通SNSリンクの取得に失敗しました',
        snsLinks: [] as CorporateSnsLink[],
        isAdmin: false,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
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

    try {
      // 🔧 修正: ensurePrismaConnection()を削除し、直接クエリ実行
      const user = await safeQuery(async () => {
        return await prisma.user.findUnique({
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
      });

      // nullチェック（永久利用権ユーザーも管理者テナントを持つ）
      if (!user?.adminOfTenant?.id) {
        return NextResponse.json({ error: 'この操作には管理者権限が必要です' }, { status: 403 });
      }

      // バリデーションを簡素化
      if (!body.platform || !body.url) {
        return NextResponse.json({ error: 'プラットフォームとURLは必須です' }, { status: 400 });
      }

      // safeQueryを使用してプラットフォーム重複確認
      const existingLink = await safeQuery(async () => {
        return await prisma.corporateSnsLink.findFirst({
          where: {
            tenantId: user.adminOfTenant!.id,
            platform: body.platform,
          },
        });
      });

      if (existingLink) {
        return NextResponse.json(
          { error: 'このプラットフォームは既に追加されています' },
          { status: 400 },
        );
      }

      // safeQueryを使用して表示順を決定
      const currentLinks = await safeQuery(async () => {
        return await prisma.corporateSnsLink.findMany({
          where: { tenantId: user.adminOfTenant!.id },
        });
      });
      const displayOrder = currentLinks.length + 1;

      // safeQueryを使用してSNSリンクを追加
      const newLink = await safeQuery(async () => {
        return await prisma.corporateSnsLink.create({
          data: {
            tenantId: user.adminOfTenant!.id,
            platform: body.platform,
            username: body.username || null,
            url: body.url,
            displayOrder,
            isRequired: body.isRequired || false,
          },
        });
      });

      return NextResponse.json({
        success: true,
        link: newLink,
      });
    } catch (dbError) {
      logger.error('法人SNS POST: データベースエラー:', dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);

      return NextResponse.json(
        {
          error: 'SNSリンクの追加に失敗しました',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    logger.error('法人SNS POST: 全体エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: '法人共通SNSリンクの追加に失敗しました',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 },
    );
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

    try {
      // 🔧 修正: ensurePrismaConnection()を削除し、直接クエリ実行
      const user = await safeQuery(async () => {
        return await prisma.user.findUnique({
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
      });

      // nullチェック（永久利用権ユーザーも管理者テナントを持つ）
      if (!user?.adminOfTenant?.id) {
        return NextResponse.json({ error: 'この操作には管理者権限が必要です' }, { status: 403 });
      }

      const { operation, data } = body;

      if (operation === 'reorder' && Array.isArray(data)) {
        // safeQueryを使用してリンクの並び替え
        await safeQuery(async () => {
          return await prisma.$transaction(
            data.map((id: string, index: number) =>
              prisma.corporateSnsLink.update({
                where: { id },
                data: { displayOrder: index + 1 },
              }),
            ),
          );
        });

        return NextResponse.json({
          success: true,
          message: '表示順を更新しました',
        });
      }

      return NextResponse.json({ error: '無効な操作です' }, { status: 400 });
    } catch (dbError) {
      logger.error('法人SNS PATCH: データベースエラー:', dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);

      return NextResponse.json(
        {
          error: '表示順の更新に失敗しました',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    logger.error('法人SNS PATCH: 全体エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: '法人共通SNSリンクの更新に失敗しました',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}