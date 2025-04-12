// app/api/corporate/tenant/route.ts を作成

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

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

    // 法人プラン登録直後の場合、テナントがなくてもエラーにしない
    if (!tenant) {
      return NextResponse.json(
        {
          success: false,
          message: '法人テナント情報が見つかりません。プロフィールページに移動します。',
          isAuthenticated: true,
        },
        { status: 200 },
      ); // 404ではなく200を返してリダイレクトを防止
    }

    // ユーザーの役割を確認
    const isAdmin = !!user.adminOfTenant;

    return NextResponse.json({
      success: true,
      tenant,
      userRole: isAdmin ? 'admin' : user.corporateRole || 'member',
    });
  } catch (error) {
    console.error('法人テナント情報取得エラー:', error);
    return NextResponse.json({ error: '法人テナント情報の取得に失敗しました' }, { status: 500 });
  }
}