// actions/profile.ts
'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createProfile } from '@/actions/user';
import { revalidatePath } from 'next/cache';

// カラーコードのバリデーションを緩和した検証スキーマ
const ProfileSchema = z.object({
  name: z.string().min(1, '名前は必須です').optional(),
  nameEn: z.string().optional().nullable(),
  bio: z.string().max(300, '自己紹介は300文字以内で入力してください').optional().nullable(),
  image: z.string().optional().nullable(),
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
  companyUrl: z.string().url({ message: '有効なURLを入力してください' }).optional().nullable(),
  companyLabel: z.string().optional().nullable(),
});

export type ProfileData = z.infer<typeof ProfileSchema>;

export async function updateProfile(data: ProfileData) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: '認証されていません' };
    }

    // データの検証
    const validatedFields = ProfileSchema.safeParse(data);

    if (!validatedFields.success) {
      // エラーの詳細情報を取得
      const errorDetails = validatedFields.error.format();
      console.error('バリデーションエラー:', errorDetails);

      // フィールド別のエラーメッセージがあればそれを返す
      const mainColorError = errorDetails.mainColor?._errors[0];
      const nameError = errorDetails.name?._errors[0];
      const companyUrlError = errorDetails.companyUrl?._errors[0];
      const headerTextError = errorDetails.headerText?._errors[0];
      const textColorError = errorDetails.textColor?._errors[0];

      if (mainColorError) {
        return { error: `メインカラー: ${mainColorError}` };
      } else if (nameError) {
        return { error: `名前: ${nameError}` };
      } else if (companyUrlError) {
        return { error: `会社URL: ${companyUrlError}` };
      } else if (headerTextError) {
        return { error: `ヘッダーテキスト: ${headerTextError}` };
      } else if (textColorError) {
        return { error: `テキストカラー: ${textColorError}` };
      }

      return { error: '入力データが無効です' };
    }

    // ユーザー情報を更新 - データベースに直接フィールド名を指定
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name ?? undefined,
        nameEn: data.nameEn ?? undefined,
        bio: data.bio ?? undefined,
        image: data.image ?? undefined,
        mainColor: data.mainColor ?? undefined,
        snsIconColor: data.snsIconColor ?? undefined,
        phone: data.phone ?? undefined,
        company: data.company ?? undefined,
        companyUrl: data.companyUrl ?? undefined,
        companyLabel: data.companyLabel ?? undefined,
      },
    });

    // プロフィールがまだない場合は作成
    const profile = await createProfile(session.user.id);

    if (!profile) {
      return { error: 'プロフィールの作成に失敗しました' };
    }

    // キャッシュを更新
    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/design');

    return { success: true, user: updatedUser, profile };
  } catch (error) {
    console.error('プロフィール更新エラー:', error);
    return { error: 'プロフィールの更新に失敗しました' };
  }
}