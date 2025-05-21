// app/api/corporate-member/profile/route.ts

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { checkPermanentAccess, getVirtualTenantData } from '@/lib/corporateAccess';

export async function GET() {
  try {
    // 永久利用権ユーザーかどうかをチェック
    const isPermanent = checkPermanentAccess();
    if (isPermanent) {
      // 仮想テナントデータからプロフィール情報を返す
      const virtualData = getVirtualTenantData();
      if (!virtualData) {
        return NextResponse.json(
          { error: '仮想テナントデータの取得に失敗しました' },
          { status: 500 },
        );
      }

      // セッションからユーザー情報を取得
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: '認証されていません' }, { status: 401 });
      }

      // ユーザー基本情報を取得
      const userData = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          nameEn: true,
          nameKana: true,
          lastName: true,
          firstName: true,
          lastNameKana: true,
          firstNameKana: true,
          bio: true,
          phone: true,
          position: true,
          image: true,
          profile: true,
        },
      });

      if (!userData) {
        return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
      }

      // 仮想テナントデータをレスポンスとして返す
      return NextResponse.json({
        user: {
          ...userData,
          department: { id: 'default-dept', name: '全社' },
          corporateRole: 'admin',
        },
        tenant: {
          id: virtualData.id,
          name: virtualData.name,
          logoUrl: virtualData.settings.logoUrl,
          primaryColor: virtualData.settings.primaryColor,
          secondaryColor: virtualData.settings.secondaryColor,
          headerText: null,
          textColor: null,
        },
      });
    }

    // 通常のユーザーの場合（永久利用権でない場合）
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // ユーザー情報を取得（テナント情報も含める）
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
      },
      tenant: tenantData,
    });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json({ error: 'プロフィール情報の取得に失敗しました' }, { status: 500 });
  }
}