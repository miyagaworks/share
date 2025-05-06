// app/api/corporate/sns/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { SNS_PLATFORMS } from '@/types/sns';
import type { CorporateSnsLink } from '@prisma/client';
import { logCorporateActivity } from '@/lib/utils/activity-logger';

// 法人共通SNSリンクの取得
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // ユーザーの法人テナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminOfTenant: true,
        tenant: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // テナント情報を取得（管理者または一般メンバーのいずれか）
    const tenant = user.adminOfTenant || user.tenant;

    if (!tenant) {
      return NextResponse.json({ error: '法人テナント情報が見つかりません' }, { status: 404 });
    }

    // 法人共通SNSリンクを取得
    const snsLinks = await prisma.corporateSnsLink.findMany({
      where: { tenantId: tenant.id },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      snsLinks,
      isAdmin: !!user.adminOfTenant,
    });
  } catch (error) {
    console.error('法人共通SNSリンク取得エラー:', error);
    return NextResponse.json({ error: '法人共通SNSリンクの取得に失敗しました' }, { status: 500 });
  }
}

// 法人共通SNSリンクの追加
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 管理者権限の確認
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminOfTenant: true,
      },
    });

    if (!user || !user.adminOfTenant) {
      return NextResponse.json({ error: 'この操作には管理者権限が必要です' }, { status: 403 });
    }

    // リクエストボディの取得と検証
    const body = await req.json();

    const schema = z.object({
      platform: z.enum(SNS_PLATFORMS),
      username: z.string().optional(),
      url: z.string().url({ message: '有効なURLを入力してください' }),
      isRequired: z.boolean().optional().default(false),
    });

    const validationResult = schema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: '入力データが無効です', details: validationResult.error.format() },
        { status: 400 },
      );
    }

    const data = validationResult.data;

    // プラットフォームが既に存在するか確認
    const existingLink = await prisma.corporateSnsLink.findFirst({
      where: {
        tenantId: user.adminOfTenant.id,
        platform: data.platform,
      },
    });

    if (existingLink) {
      return NextResponse.json(
        { error: 'このプラットフォームは既に追加されています' },
        { status: 400 },
      );
    }

    // 現在のリンク数を取得して表示順を決定
    const currentLinks = await prisma.corporateSnsLink.findMany({
      where: { tenantId: user.adminOfTenant.id },
    });

    const displayOrder = currentLinks.length + 1;

    // SNSリンクを追加
    const newLink = await prisma.corporateSnsLink.create({
      data: {
        tenantId: user.adminOfTenant.id,
        platform: data.platform,
        username: data.username,
        url: data.url,
        displayOrder,
        isRequired: data.isRequired,
      },
    });

    await logCorporateActivity({
      tenantId: user.adminOfTenant.id,
      userId: session.user.id,
      action: 'update_sns',
      entityType: 'sns_link',
      entityId: newLink.id, // newLinkが定義されていることを確認
      description: `${data.platform}のSNSリンクを追加しました`,
      metadata: {
        platform: data.platform,
        username: data.username || null,
        url: data.url,
        isRequired: !!data.isRequired,
      },
    });

    return NextResponse.json({
      success: true,
      link: newLink,
    });
  } catch (error) {
    console.error('法人共通SNSリンク追加エラー:', error);
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

    // 管理者権限の確認
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminOfTenant: true,
      },
    });

    if (!user || !user.adminOfTenant) {
      return NextResponse.json({ error: 'この操作には管理者権限が必要です' }, { status: 403 });
    }

    // リクエストボディの取得と検証
    const body = await req.json();

    // 操作タイプによって処理を分岐
    const { operation, data } = body;

    if (operation === 'reorder' && Array.isArray(data)) {
      // リンクの並び替え
      const linkIds = data;

      // 各リンクのIDを検証
      const links = await prisma.corporateSnsLink.findMany({
        where: {
          id: { in: linkIds },
          tenantId: user.adminOfTenant.id,
        },
      });

      if (links.length !== linkIds.length) {
        return NextResponse.json({ error: '無効なリンクIDが含まれています' }, { status: 400 });
      }

      // トランザクションで一括更新
      await prisma.$transaction(
        linkIds.map((id, index) =>
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
    } else if (operation === 'sync') {
      // 全ユーザーにSNSリンクを同期
      // 法人共通SNSリンクを取得
      const corporateSnsLinks = await prisma.corporateSnsLink.findMany({
        where: { tenantId: user.adminOfTenant.id },
        orderBy: { displayOrder: 'asc' },
      });

      if (corporateSnsLinks.length === 0) {
        return NextResponse.json({
          success: true,
          message: '同期するSNSリンクがありません',
        });
      }

      // テナントに所属するユーザーを取得
      const tenantUsers = await prisma.user.findMany({
        where: {
          OR: [
            { tenantId: user.adminOfTenant.id },
            { adminOfTenant: { id: user.adminOfTenant.id } },
          ],
        },
        include: {
          snsLinks: true,
        },
      });

      let updatedCount = 0;
      let createdCount = 0;

      // 各ユーザーに対して処理
      for (const tenantUser of tenantUsers) {
        // 既存のSNSリンクマップを作成
        const userSnsLinksMap = new Map(tenantUser.snsLinks.map((link) => [link.platform, link]));

        // 必須の法人共通SNSリンクを追加/更新
        for (const corpLink of corporateSnsLinks.filter(
          (link: CorporateSnsLink) => link.isRequired,
        )) {
          const existingUserLink = userSnsLinksMap.get(corpLink.platform);

          if (existingUserLink) {
            // 既存のリンクを更新
            await prisma.snsLink.update({
              where: { id: existingUserLink.id },
              data: {
                url: corpLink.url,
                username: corpLink.username,
              },
            });
            updatedCount++;
          } else {
            // 新しいリンクを追加
            // 現在のユーザーのSNSリンク最大表示順を取得
            const maxDisplayOrder =
              tenantUser.snsLinks.length > 0
                ? Math.max(...tenantUser.snsLinks.map((link) => link.displayOrder))
                : 0;

            await prisma.snsLink.create({
              data: {
                userId: tenantUser.id,
                platform: corpLink.platform,
                username: corpLink.username,
                url: corpLink.url,
                displayOrder: maxDisplayOrder + 1,
              },
            });
            createdCount++;
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `${tenantUsers.length}人のユーザーに対して、${updatedCount}件のリンクを更新、${createdCount}件のリンクを追加しました`,
      });
    }

    return NextResponse.json({ error: '無効な操作です' }, { status: 400 });
  } catch (error) {
    console.error('法人共通SNSリンク更新エラー:', error);
    return NextResponse.json({ error: '法人共通SNSリンクの更新に失敗しました' }, { status: 500 });
  }
}