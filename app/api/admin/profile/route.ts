// app/api/admin/profile/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkAdminPermission } from '@/lib/utils/admin-access-server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

// 管理者プロフィール更新用スキーマ
const AdminProfileSchema = z.object({
  name: z.string().min(1, '名前は必須です').optional(),
  nameEn: z.string().optional().nullable(),
  bio: z.string().max(300, '自己紹介は300文字以内で入力してください').optional().nullable(),
  image: z.string().url('有効なURLを入力してください').optional().nullable().or(z.literal('')),
  mainColor: z
    .string()
    .regex(
      /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/,
      '有効なカラーコード(#RGB または #RRGGBB)を入力してください',
    )
    .optional()
    .nullable(),
  snsIconColor: z.string().optional().nullable(),
  headerText: z.string().max(38, 'ヘッダーテキストは最大38文字までです').optional().nullable(),
  textColor: z
    .string()
    .regex(
      /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/,
      '有効なカラーコード(#RGB または #RRGGBB)を入力してください',
    )
    .optional()
    .nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  companyUrl: z.string().url('有効なURLを入力してください').optional().nullable().or(z.literal('')),
  companyLabel: z.string().optional().nullable(),
});

// 管理者プロフィール取得（財務管理者権限以上必要）
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 財務管理者権限以上をチェック
    const hasPermission = await checkAdminPermission(session.user.id, 'financial');
    if (!hasPermission) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    // ユーザー情報取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        nameEn: true,
        bio: true,
        image: true,
        mainColor: true,
        snsIconColor: true,
        headerText: true,
        textColor: true,
        phone: true,
        company: true,
        companyUrl: true,
        companyLabel: true,
        isFinancialAdmin: true,
        financialAdminRecord: {
          select: {
            isActive: true,
            addedAt: true,
            notes: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    logger.info('管理者プロフィール取得成功:', {
      userId: session.user.id,
      email: user.email,
      isFinancialAdmin: user.isFinancialAdmin,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        nameEn: user.nameEn,
        bio: user.bio,
        image: user.image,
        mainColor: user.mainColor,
        snsIconColor: user.snsIconColor,
        headerText: user.headerText,
        textColor: user.textColor,
        phone: user.phone,
        company: user.company,
        companyUrl: user.companyUrl,
        companyLabel: user.companyLabel,
        adminInfo: {
          isFinancialAdmin: user.isFinancialAdmin,
          addedAt: user.financialAdminRecord?.addedAt,
          notes: user.financialAdminRecord?.notes,
        },
      },
    });
  } catch (error: any) {
    logger.error('管理者プロフィール取得エラー:', error);
    return NextResponse.json(
      {
        error: 'プロフィール情報の取得に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

// 管理者プロフィール更新（財務管理者権限以上必要）
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 財務管理者権限以上をチェック
    const hasPermission = await checkAdminPermission(session.user.id, 'financial');
    if (!hasPermission) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const body = await request.json();

    // データ検証
    const validatedFields = AdminProfileSchema.safeParse(body);
    if (!validatedFields.success) {
      const errorDetails = validatedFields.error.format();
      console.error('バリデーションエラー:', errorDetails);

      // 主要なエラーメッセージを返す
      const errors = validatedFields.error.errors;
      const firstError = errors[0];
      return NextResponse.json(
        { error: `${firstError.path.join('.')}: ${firstError.message}` },
        { status: 400 },
      );
    }

    const data = validatedFields.data;

    // プロフィール更新
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.image !== undefined) updateData.image = data.image || null;
    if (data.mainColor !== undefined) updateData.mainColor = data.mainColor;
    if (data.snsIconColor !== undefined) updateData.snsIconColor = data.snsIconColor;
    if (data.headerText !== undefined) updateData.headerText = data.headerText;
    if (data.textColor !== undefined) updateData.textColor = data.textColor;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.companyUrl !== undefined) updateData.companyUrl = data.companyUrl || null;
    if (data.companyLabel !== undefined) updateData.companyLabel = data.companyLabel;

    // プロフィール更新
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isFinancialAdmin: true,
      },
    });

    logger.info('管理者プロフィール更新成功:', {
      userId: session.user.id,
      email: updatedUser.email,
      name: updatedUser.name,
      isFinancialAdmin: updatedUser.isFinancialAdmin,
      updatedFields: Object.keys(data).filter(
        (key) => data[key as keyof typeof data] !== undefined,
      ),
    });

    return NextResponse.json({
      success: true,
      message: 'プロフィールを更新しました',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });
  } catch (error: any) {
    logger.error('管理者プロフィール更新エラー:', error);
    return NextResponse.json(
      {
        error: 'プロフィールの更新に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}