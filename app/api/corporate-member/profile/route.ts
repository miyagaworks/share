// app/api/corporate-member/profile/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // ユーザー情報を取得（テナント情報と会社/組織情報も含める）
    const userData = await prisma.user.findUnique({
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
          },
        },
      },
    });

    if (!userData) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // テナント情報（管理者または一般メンバーのいずれか）
    const tenantData = userData.adminOfTenant || userData.tenant;

    return NextResponse.json({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        nameEn: userData.nameEn,
        nameKana: userData.nameKana,
        lastName: userData.lastName,
        firstName: userData.firstName,
        lastNameKana: userData.lastNameKana,
        firstNameKana: userData.firstNameKana,
        bio: userData.bio,
        phone: userData.phone,
        position: userData.position,
        image: userData.image,
        department: userData.department,
        corporateRole: userData.corporateRole,
        profile: userData.profile,
        // 会社/組織情報を追加
        company: userData.company,
        companyUrl: userData.companyUrl,
        companyLabel: userData.companyLabel,
      },
      tenant: tenantData,
    });
  } catch (error) {
    logger.error('プロフィール取得エラー:', error);
    return NextResponse.json({ error: 'プロフィール情報の取得に失敗しました' }, { status: 500 });
  }
}