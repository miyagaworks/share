// app/api/corporate/sns/[id]/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkPermanentAccess, getVirtualTenantData } from '@/lib/corporateAccessState';
// import type { CorporateSnsLink } from '@prisma/client';

// 法人共通SNSリンクの取得
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 永久利用権ユーザーかどうかチェック
    const isPermanent = checkPermanentAccess();
    if (isPermanent) {
      // 仮想テナントデータからSNSリンク情報を返す
      const virtualData = getVirtualTenantData();
      if (!virtualData) {
        return NextResponse.json(
          { error: '仮想テナントデータの取得に失敗しました' },
          { status: 500 },
        );
      }

      // IDに一致するSNSリンクを検索
      const snsLink = virtualData.snsLinks.find((link) => link.id === params.id);
      if (!snsLink) {
        return NextResponse.json({ error: 'リンクが見つかりません' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        link: snsLink,
        isAdmin: true,
      });
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    const linkId = params.id;

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

    // リンク情報を取得
    const link = await prisma.corporateSnsLink.findFirst({
      where: {
        id: linkId,
        tenantId: tenant.id,
      },
    });

    if (!link) {
      return NextResponse.json({ error: 'リンクが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      link,
      isAdmin: !!user.adminOfTenant,
    });
  } catch (error) {
    console.error('法人共通SNSリンク取得エラー:', error);
    return NextResponse.json({ error: '法人共通SNSリンクの取得に失敗しました' }, { status: 500 });
  }
}

// 法人共通SNSリンクの更新
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 永久利用権ユーザーかどうかチェック
    const isPermanent = checkPermanentAccess();
    if (isPermanent) {
      // リクエストボディを取得
      const body = await req.json();

      return NextResponse.json({
        success: true,
        message: '永久利用権ユーザーのSNSリンク設定は更新されません',
        link: {
          id: params.id,
          platform: 'platform' in body ? body.platform : 'unknown',
          username: 'username' in body ? body.username : null,
          url: 'url' in body ? body.url : 'https://example.com',
          isRequired: 'isRequired' in body ? body.isRequired : false,
        },
      });
    }

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

    const linkId = params.id;

    // リンクが存在するか確認
    const link = await prisma.corporateSnsLink.findFirst({
      where: {
        id: linkId,
        tenantId: user.adminOfTenant.id,
      },
    });

    if (!link) {
      return NextResponse.json({ error: 'リンクが見つかりません' }, { status: 404 });
    }

    // リクエストボディの取得と検証
    const body = await req.json();

    const schema = z.object({
      username: z.string().optional(),
      url: z.string().url({ message: '有効なURLを入力してください' }),
      isRequired: z.boolean().optional(),
    });

    const validationResult = schema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: '入力データが無効です', details: validationResult.error.format() },
        { status: 400 },
      );
    }

    const data = validationResult.data;

    // リンクを更新
    const updatedLink = await prisma.corporateSnsLink.update({
      where: { id: linkId },
      data: {
        username: data.username,
        url: data.url,
        isRequired: data.isRequired !== undefined ? data.isRequired : link.isRequired,
      },
    });

    return NextResponse.json({
      success: true,
      link: updatedLink,
    });
  } catch (error) {
    console.error('法人共通SNSリンク更新エラー:', error);
    return NextResponse.json({ error: '法人共通SNSリンクの更新に失敗しました' }, { status: 500 });
  }
}

// 法人共通SNSリンクの削除
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 永久利用権ユーザーかどうかチェック
    const isPermanent = checkPermanentAccess();
    if (isPermanent) {
      return NextResponse.json({
        success: true,
        message: '永久利用権ユーザーのSNSリンク設定は削除されません',
      });
    }

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

    const linkId = params.id;

    // リンクが存在するか確認
    const link = await prisma.corporateSnsLink.findFirst({
      where: {
        id: linkId,
        tenantId: user.adminOfTenant.id,
      },
    });

    if (!link) {
      return NextResponse.json({ error: 'リンクが見つかりません' }, { status: 404 });
    }

    // 管理者は必須リンクも削除可能
    // 必須フラグのチェックを削除

    // リンクを削除
    await prisma.corporateSnsLink.delete({
      where: { id: linkId },
    });

    // 残りのリンクの表示順を再調整
    const remainingLinks = await prisma.corporateSnsLink.findMany({
      where: { tenantId: user.adminOfTenant.id },
      orderBy: { displayOrder: 'asc' },
    });

    // 表示順を更新
    for (let i = 0; i < remainingLinks.length; i++) {
      await prisma.corporateSnsLink.update({
        where: { id: remainingLinks[i].id },
        data: { displayOrder: i + 1 },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'リンクを削除しました',
    });
  } catch (error) {
    console.error('法人共通SNSリンク削除エラー:', error);
    return NextResponse.json({ error: '法人共通SNSリンクの削除に失敗しました' }, { status: 500 });
  }
}