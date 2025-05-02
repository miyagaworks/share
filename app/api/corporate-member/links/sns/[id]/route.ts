// app/api/corporate-member/links/sns/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// バリデーションスキーマ
const SnsLinkUpdateSchema = z.object({
  platform: z.string(),
  username: z.string().optional(),
  url: z.string().url({ message: '有効なURLを入力してください' }),
  displayOrder: z.number().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // リクエストボディの取得
    const body = await req.json();

    // データの検証
    const validationResult = SnsLinkUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      return NextResponse.json({ error: '入力データが無効です', details: errors }, { status: 400 });
    }

    const data = validationResult.data;

    // 指定されたSNSリンクを検索
    const snsLink = await prisma.snsLink.findUnique({
      where: {
        id: params.id,
      },
    });

    // リンクが存在しない場合はエラー
    if (!snsLink) {
      return NextResponse.json({ error: 'SNSリンクが見つかりません' }, { status: 404 });
    }

    // 権限チェック
    if (snsLink.userId !== session.user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    // SNSリンクを更新
    const updatedSnsLink = await prisma.snsLink.update({
      where: {
        id: params.id,
      },
      data: {
        platform: data.platform,
        username: data.username,
        url: data.url,
        displayOrder: data.displayOrder || snsLink.displayOrder,
      },
    });

    return NextResponse.json({
      success: true,
      snsLink: updatedSnsLink,
    });
  } catch (error) {
    console.error('SNSリンク更新エラー:', error);
    return NextResponse.json({ error: 'SNSリンクの更新に失敗しました' }, { status: 500 });
  }
}

// SNSリンク削除API
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 指定されたSNSリンクを検索
    const snsLink = await prisma.snsLink.findUnique({
      where: {
        id: params.id,
      },
    });

    // リンクが存在しない場合はエラー
    if (!snsLink) {
      return NextResponse.json({ error: 'SNSリンクが見つかりません' }, { status: 404 });
    }

    // 権限チェック
    if (snsLink.userId !== session.user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    // 法人テナントの必須SNSかどうかをチェック
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        tenant: {
          include: {
            corporateSnsLinks: true,
          },
        },
      },
    });

    const corporateSnsLinks = user?.tenant?.corporateSnsLinks || [];
    const requiredPlatforms = corporateSnsLinks
      .filter((link) => link.isRequired)
      .map((link) => link.platform);

    // 必須SNSは削除不可
    if (requiredPlatforms.includes(snsLink.platform)) {
      return NextResponse.json(
        {
          error: 'このSNSリンクは法人設定で必須とされているため削除できません',
        },
        { status: 403 },
      );
    }

    // SNSリンクを削除
    await prisma.snsLink.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'SNSリンクを削除しました',
    });
  } catch (error) {
    console.error('SNSリンク削除エラー:', error);
    return NextResponse.json({ error: 'SNSリンクの削除に失敗しました' }, { status: 500 });
  }
}