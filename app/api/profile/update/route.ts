// app/api/profile/update/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
// バリデーションスキーマ
const ProfileUpdateSchema = z.object({
  lastName: z.string().optional(),
  firstName: z.string().optional(),
  lastNameKana: z.string().optional().nullable(),
  firstNameKana: z.string().optional().nullable(),
  nameEn: z.string().optional().nullable(),
  bio: z.string().max(300, '自己紹介は300文字以内で入力してください').optional().nullable(),
  image: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  companyUrl: z.string().optional().nullable(),
  companyLabel: z.string().optional().nullable(),
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
    const data = validationResult.data;
    // 姓名とフリガナの処理
    // nullや空文字を適切に処理
    let name: string | undefined = undefined;
    let nameKana: string | undefined | null = undefined;
    // 姓名の結合処理
    if (typeof data.lastName === 'string' || typeof data.firstName === 'string') {
      const lastNameStr = typeof data.lastName === 'string' ? data.lastName : '';
      const firstNameStr = typeof data.firstName === 'string' ? data.firstName : '';
      if (lastNameStr || firstNameStr) {
        name = [lastNameStr, firstNameStr].filter(Boolean).join(' ');
      }
    }
    // フリガナの結合処理
    if (typeof data.lastNameKana === 'string' || typeof data.firstNameKana === 'string') {
      const lastNameKanaStr = typeof data.lastNameKana === 'string' ? data.lastNameKana : '';
      const firstNameKanaStr = typeof data.firstNameKana === 'string' ? data.firstNameKana : '';
      if (lastNameKanaStr || firstNameKanaStr) {
        nameKana = [lastNameKanaStr, firstNameKanaStr].filter(Boolean).join(' ');
      }
    }
    // 更新データを準備
    const updateData: Record<string, unknown> = {
      // 結合したフィールド
      name,
      nameKana,
      // 分割したフィールド
      lastName: data.lastName,
      firstName: data.firstName,
      lastNameKana: data.lastNameKana,
      firstNameKana: data.firstNameKana,
      // その他のフィールド
      nameEn: data.nameEn,
      bio: data.bio,
      image: data.image,
      phone: data.phone,
      company: data.company,
      companyUrl: data.companyUrl,
      companyLabel: data.companyLabel,
    };
    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });
    // プロフィールがまだない場合は作成
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
    // パスワードを除外する処理
    const safeUser = { ...updatedUser };
    // 型安全に除外する
    if ('password' in safeUser) {
      const typedUser = safeUser as { password?: string | null };
      delete typedUser.password;
    }
    return NextResponse.json({
      success: true,
      user: safeUser,
      profile,
    });
  } catch (error) {
    logger.error('プロフィール更新エラー:', error);
    return NextResponse.json({ error: 'プロフィールの更新に失敗しました' }, { status: 500 });
  }
}