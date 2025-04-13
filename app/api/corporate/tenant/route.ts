// app/api/corporate/tenant/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { checkCorporateAccess } from '@/lib/utils/corporate-access';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 法人アクセス権を確認
    const accessCheck = await checkCorporateAccess(session.user.id);
    if (!accessCheck.hasCorporateAccess) {
      return NextResponse.json(
        {
          success: false,
          error:
            accessCheck.error ||
            '法人テナント情報が見つかりません。法人プランにアップグレードしてください。',
          hasCorporateAccess: false,
        },
        { status: 403 },
      );
    }

    // ユーザーの法人テナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminOfTenant: {
          include: {
            departments: true,
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                corporateRole: true,
              },
            },
          },
        },
        tenant: {
          include: {
            departments: true,
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                corporateRole: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // テナント情報を取得（管理者または一般メンバーのいずれか）
    const tenant = user.adminOfTenant || user.tenant;

    // 法人テナントが存在しない場合は403エラーを返す
    if (!tenant) {
      return NextResponse.json(
        {
          success: false,
          error: '法人テナント情報が見つかりません。法人プランにアップグレードしてください。',
          hasCorporateAccess: false,
        },
        { status: 403 },
      );
    }

    // ユーザーの役割を確認
    const isAdmin = !!user.adminOfTenant;

    return NextResponse.json({
      success: true,
      tenant,
      userRole: isAdmin ? 'admin' : user.corporateRole || 'member',
      hasCorporateAccess: true,
    });
  } catch (error) {
    console.error('法人テナント情報取得エラー:', error);
    return NextResponse.json(
      {
        error: '法人テナント情報の取得に失敗しました',
        hasCorporateAccess: false,
      },
      { status: 500 },
    );
  }
}