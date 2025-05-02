// app/api/corporate-profile/links/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // ユーザー情報とテナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        tenant: {
          select: {
            primaryColor: true,
            secondaryColor: true,
          },
        },
        adminOfTenant: {
          select: {
            primaryColor: true,
            secondaryColor: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // テナント情報を取得（管理者または一般メンバー）
    const tenantInfo = user.adminOfTenant || user.tenant;

    // SNSリンクとカスタムリンクを取得
    const snsLinks = await prisma.snsLink.findMany({
      where: { userId: session.user.id },
      orderBy: { displayOrder: 'asc' },
    });

    const customLinks = await prisma.customLink.findMany({
      where: { userId: session.user.id },
      orderBy: { displayOrder: 'asc' },
    });

    // リンクデータに法人カラー情報を追加
    const enrichedSnsLinks = snsLinks.map((link) => ({
      ...link,
      corporateColors: {
        primaryColor: tenantInfo?.primaryColor || '#3B82F6',
        secondaryColor: tenantInfo?.secondaryColor || 'var(--color-corporate-secondary)',
      },
    }));

    const enrichedCustomLinks = customLinks.map((link) => ({
      ...link,
      corporateColors: {
        primaryColor: tenantInfo?.primaryColor || '#3B82F6',
        secondaryColor: tenantInfo?.secondaryColor || 'var(--color-corporate-secondary)',
      },
    }));

    return NextResponse.json({
      success: true,
      snsLinks: enrichedSnsLinks,
      customLinks: enrichedCustomLinks,
      corporateColors: {
        primaryColor: tenantInfo?.primaryColor || '#3B82F6',
        secondaryColor: tenantInfo?.secondaryColor || 'var(--color-corporate-secondary)',
      },
    });
  } catch (error) {
    console.error('リンク取得エラー:', error);
    return NextResponse.json({ error: 'リンク情報の取得に失敗しました' }, { status: 500 });
  }
}