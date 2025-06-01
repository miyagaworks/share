// app/api/corporate-profile/route.ts (修正版)
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
    // ユーザー情報とテナント情報を取得
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
    if (!userData) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    // テナント情報（管理者または一般メンバーのいずれか）
    const tenantData = userData.adminOfTenant || userData.tenant;
    // テナントがない場合のエラーハンドリング
    if (!tenantData) {
      logger.debug('テナント情報が見つかりません:', {
        userId: userData.id,
        hasTenant: !!userData.tenant,
        isAdmin: !!userData.adminOfTenant,
      });
      // 永久利用権ユーザーの場合は仮想テナントを返す
      if (userData.subscriptionStatus === 'permanent') {
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
            department: null,
            corporateRole: 'admin',
            profile: userData.profile,
          },
          tenant: {
            id: `virtual-tenant-${userData.id}`,
            name: '永久利用権ユーザー',
            logoUrl: null,
            logoWidth: null,
            logoHeight: null,
            primaryColor: '#1E3A8A',
            secondaryColor: '#122153',
            headerText: null,
            textColor: '#FFFFFF',
            accountStatus: 'active',
          },
        });
      }
      return NextResponse.json({ error: 'テナント情報が見つかりません' }, { status: 404 });
    }
    // テナントが停止されているかチェック
    if (tenantData.accountStatus === 'suspended') {
      return NextResponse.json({ error: 'テナントが停止されています' }, { status: 403 });
    }
    // SNSリンク数を取得
    const snsLinksCount = await prisma.snsLink.count({
      where: { userId: userData.id },
    });
    // カスタムリンク数を取得
    const customLinksCount = await prisma.customLink.count({
      where: { userId: userData.id },
    });
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
        // 追加情報
        snsLinksCount,
        customLinksCount,
      },
      tenant: tenantData,
    });
  } catch (error) {
    logger.error('法人プロフィール取得エラー:', error);
    return NextResponse.json({ error: 'プロフィール情報の取得に失敗しました' }, { status: 500 });
  }
}