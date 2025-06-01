// app/api/corporate-member/links/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
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
            primaryColor: true,
            secondaryColor: true,
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
        adminOfTenant: {
          select: {
            id: true,
            name: true,
            primaryColor: true,
            secondaryColor: true,
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
    // テナント情報を取得（管理者または一般メンバー）
    const tenantInfo = user.adminOfTenant || user.tenant;
    if (!tenantInfo) {
      return NextResponse.json({ error: 'テナント情報が見つかりません' }, { status: 404 });
    }
    // 法人SNSと個人SNSを統合して返す
    const corporateSnsLinks = tenantInfo.corporateSnsLinks || [];
    const personalSnsLinks = user.snsLinks || [];
    const customLinks = user.customLinks || [];
    // 法人カラー情報
    const corporateColors = {
      primaryColor: tenantInfo.primaryColor || '#3B82F6',
      secondaryColor: tenantInfo.secondaryColor || 'var(--color-corporate-secondary)',
    };
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
  } catch (error) {
    logger.error('リンク情報取得エラー:', error);
    return NextResponse.json({ error: 'リンク情報の取得に失敗しました' }, { status: 500 });
  }
}