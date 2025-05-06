export const dynamic = "force-dynamic";
// app/api/corporate-member/profile/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// バリデーションスキーマ
const ProfileUpdateSchema = z.object({
  name: z.string().min(1, '名前は必須です').optional(),
  nameEn: z.string().optional().nullable(),
  bio: z.string().max(300, '自己紹介は300文字以内で入力してください').optional().nullable(),
  image: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  position: z.string().max(50, '役職は50文字以内で入力してください').optional().nullable(), // 役職フィールド追加
  // 外観設定関連のフィールドを残す（他の場所で使用されている可能性があるため）
  headerText: z
    .string()
    .max(50, 'ヘッダーテキストは50文字以内で入力してください')
    .optional()
    .nullable(),
  textColor: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // リクエストボディの取得
    const body = await req.json();

    // データの検証
    const validationResult = ProfileUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      return NextResponse.json({ error: '入力データが無効です', details: errors }, { status: 400 });
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
    if (!user.tenant && !user.adminOfTenant) {
      return NextResponse.json({ error: '法人テナントに所属していません' }, { status: 403 });
    }

    // ユーザーの役割を確認（管理者かどうか）
    // 将来使用するかも？
    // const isAdmin = !!user.adminOfTenant || user.corporateRole === 'admin';
    const data = validationResult.data;

    // 更新データを準備
    const updateData: Record<string, unknown> = {
      name: data.name,
      nameEn: data.nameEn,
      bio: data.bio,
      phone: data.phone,
      position: data.position, // 役職フィールド追加
      image: data.image,
      headerText: data.headerText,
      textColor: data.textColor,
    };

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    // プロフィールが存在しない場合は作成
    let profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      // スラッグを生成
      const slug = `${session.user.id.substring(0, 8)}`;

      profile = await prisma.profile.create({
        data: {
          userId: session.user.id,
          slug,
          isPublic: true,
        },
      });
    }

    // センシティブ情報を除外
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = updatedUser;

    return NextResponse.json({
      success: true,
      user: safeUser,
      profile,
    });
  } catch (error) {
    console.error('プロフィール更新エラー:', error);
    return NextResponse.json({ error: 'プロフィールの更新に失敗しました' }, { status: 500 });
  }
}