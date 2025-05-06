// app/api/corporate-member/links/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            corporateSnsLinks: {
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
            },
          },
        },
        snsLinks: {
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
        },
        customLinks: {
          select: {
            id: true,
            name: true,
            url: true,
            displayOrder: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 法人SNSと個人SNSを統合して返す
    const corporateSnsLinks = user.tenant?.corporateSnsLinks || [];
    const personalSnsLinks = user.snsLinks || [];
    const customLinks = user.customLinks || [];

    return NextResponse.json({
      success: true,
      corporateSnsLinks,
      personalSnsLinks,
      customLinks,
    });
  } catch (error) {
    console.error('リンク情報取得エラー:', error);
    return NextResponse.json({ error: 'リンク情報の取得に失敗しました' }, { status: 500 });
  }
}