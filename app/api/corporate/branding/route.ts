// app/api/corporate/branding/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// ブランディング設定の取得（GET）
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // ユーザーのテナント情報を取得
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

    return NextResponse.json({
      success: true,
      branding: {
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
      },
    });
  } catch (error) {
    console.error('ブランディング情報取得エラー:', error);
    return NextResponse.json({ error: 'ブランディング情報の取得に失敗しました' }, { status: 500 });
  }
}

// ブランディング設定の更新（PUT）
export async function PUT(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // リクエストボディの取得
    const body = await req.json();
    const { primaryColor, secondaryColor, logoUrl } = body;

    // ユーザーとテナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminOfTenant: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 管理者権限の確認
    if (!user.adminOfTenant) {
      return NextResponse.json(
        { error: 'ブランディング設定の変更には管理者権限が必要です' },
        { status: 403 },
      );
    }

    // テナント情報を更新
    const updatedTenant = await prisma.corporateTenant.update({
      where: { id: user.adminOfTenant.id },
      data: {
        primaryColor,
        secondaryColor,
        logoUrl,
      },
    });

    return NextResponse.json({
      success: true,
      tenant: updatedTenant,
    });
  } catch (error) {
    console.error('ブランディング設定更新エラー:', error);
    return NextResponse.json({ error: 'ブランディング設定の更新に失敗しました' }, { status: 500 });
  }
}