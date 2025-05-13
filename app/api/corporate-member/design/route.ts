// app/api/corporate-member/design/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// バリデーションスキーマ
const DesignUpdateSchema = z.object({
  mainColor: z.string().optional().nullable(),
  snsIconColor: z.string().optional().nullable(),
  bioBackgroundColor: z.string().optional().nullable(),
  bioTextColor: z.string().optional().nullable(),
});

// GET: ユーザーのデザイン設定を取得
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
        tenant: true,
        adminOfTenant: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // ユーザーが法人テナントに所属しているか確認
    if (!user.tenantId && !user.adminOfTenant) {
      return NextResponse.json({ error: '法人テナントに所属していません' }, { status: 403 });
    }

    // テナント情報を取得（管理者または一般メンバー）
    const tenant = user.adminOfTenant || user.tenant;

    // テナント情報がない場合
    if (!tenant) {
      return NextResponse.json({ error: '法人テナント情報が見つかりません' }, { status: 404 });
    }

    // テナントのprimaryColorとsecondaryColorを優先的に使用
    // ユーザーにmainColorとsnsIconColorのみ設定可能（法人優先）
    return NextResponse.json({
      success: true,
      design: {
        mainColor: user.mainColor,
        snsIconColor: user.snsIconColor,
        bioBackgroundColor: user.bioBackgroundColor || '#FFFFFF',
        bioTextColor: user.bioTextColor || '#333333',
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        headerText: tenant.headerText || null,
        textColor: tenant.textColor || '#FFFFFF',
      },
    });
  } catch (error) {
    console.error('デザイン設定取得エラー:', error);
    return NextResponse.json({ error: 'デザイン設定の取得に失敗しました' }, { status: 500 });
  }
}

// POST: ユーザーのデザイン設定を更新
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // リクエストボディの取得
    const body = await req.json();

    // データの検証
    const validationResult = DesignUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      return NextResponse.json({ error: '入力データが無効です', details: errors }, { status: 400 });
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        tenant: true,
        adminOfTenant: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // ユーザーが法人テナントに所属しているか確認
    if (!user.tenantId && !user.adminOfTenant) {
      return NextResponse.json({ error: '法人テナントに所属していません' }, { status: 403 });
    }

    const data = validationResult.data;

    // 更新データを準備
    const updateData: Record<string, unknown> = {};

    // SNSアイコンカラーのみ更新可能（法人優先）
    if (data.snsIconColor !== undefined) {
      updateData.snsIconColor = data.snsIconColor;
    }

    // 追加: 自己紹介ページの設定を更新
    if (data.bioBackgroundColor !== undefined) {
      updateData.bioBackgroundColor = data.bioBackgroundColor;
    }

    if (data.bioTextColor !== undefined) {
      updateData.bioTextColor = data.bioTextColor;
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      design: {
        mainColor: updatedUser.mainColor,
        snsIconColor: updatedUser.snsIconColor,
        bioBackgroundColor: updatedUser.bioBackgroundColor || '#FFFFFF', // 追加
        bioTextColor: updatedUser.bioTextColor || '#333333', // 追加
      },
    });
  } catch (error) {
    console.error('デザイン設定更新エラー:', error);
    return NextResponse.json({ error: 'デザイン設定の更新に失敗しました' }, { status: 500 });
  }
}
