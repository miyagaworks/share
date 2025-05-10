// actions/profile.ts
'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ProfileSchema } from '@/schemas/auth';
import { createProfile } from '@/actions/user';
import { revalidatePath } from 'next/cache';
import { ProfileUpdateData } from '@/types/profiles';

// 検証結果の型定義
interface ValidationSuccess {
  success: true;
  data: Record<string, unknown>;
}

interface ValidationError {
  success: false;
  error: Record<string, unknown>;
}

type ValidationResult = ValidationSuccess | ValidationError;

// 新しい検証ロジックの実装
const validateProfileData = (data: ProfileUpdateData): ValidationResult => {
  // nullをundefinedに変換して、ProfileSchemaとの互換性を確保
  const sanitizedData: Record<string, unknown> = {};

  Object.entries(data).forEach(([key, value]) => {
    // nullをundefined（または期待される値）に変換
    if (value === null && key === 'name') {
      sanitizedData[key] = undefined;
    } else {
      sanitizedData[key] = value;
    }
  });

  // バリデーション実行
  const result = ProfileSchema.safeParse(sanitizedData);

  if (!result.success) {
    return { success: false, error: result.error.format() };
  }

  return { success: true, data: result.data };
};

export async function updateProfile(data: ProfileUpdateData) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: '認証されていません' };
    }

    // データの検証
    const validationResult = validateProfileData(data);

    if (!validationResult.success) {
      console.error('バリデーションエラー:', validationResult.error);
      return { error: '入力データが無効です' };
    }

    // 検証済みデータを使用
    const validatedData = validationResult.data;

    // 姓名とフリガナの処理
    // nullや空文字を適切に処理
    let name: string | undefined = undefined;
    let nameKana: string | undefined | null = undefined;

    // 姓名の結合処理
    if (typeof validatedData.lastName === 'string' || typeof validatedData.firstName === 'string') {
      const lastNameStr = typeof validatedData.lastName === 'string' ? validatedData.lastName : '';
      const firstNameStr =
        typeof validatedData.firstName === 'string' ? validatedData.firstName : '';
      if (lastNameStr || firstNameStr) {
        name = [lastNameStr, firstNameStr].filter(Boolean).join(' ');
      }
    } else if (typeof validatedData.name === 'string') {
      name = validatedData.name;
    }

    // フリガナの結合処理
    if (
      typeof validatedData.lastNameKana === 'string' ||
      typeof validatedData.firstNameKana === 'string'
    ) {
      const lastNameKanaStr =
        typeof validatedData.lastNameKana === 'string' ? validatedData.lastNameKana : '';
      const firstNameKanaStr =
        typeof validatedData.firstNameKana === 'string' ? validatedData.firstNameKana : '';
      if (lastNameKanaStr || firstNameKanaStr) {
        nameKana = [lastNameKanaStr, firstNameKanaStr].filter(Boolean).join(' ');
      }
    } else if (typeof validatedData.nameKana === 'string') {
      nameKana = validatedData.nameKana;
    }

    // ユーザー情報を更新 - データベースに直接フィールド名を指定
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        // 結合したフィールド（従来形式）
        name,
        nameKana,

        // 分割したフィールド（新形式）
        lastName: typeof validatedData.lastName === 'string' ? validatedData.lastName : undefined,
        firstName:
          typeof validatedData.firstName === 'string' ? validatedData.firstName : undefined,
        lastNameKana:
          typeof validatedData.lastNameKana === 'string' ? validatedData.lastNameKana : undefined,
        firstNameKana:
          typeof validatedData.firstNameKana === 'string' ? validatedData.firstNameKana : undefined,

        // 他の共通フィールド
        nameEn: typeof validatedData.nameEn === 'string' ? validatedData.nameEn : undefined,
        bio: typeof validatedData.bio === 'string' ? validatedData.bio : undefined,
        image: typeof validatedData.image === 'string' ? validatedData.image : undefined,
        mainColor:
          typeof validatedData.mainColor === 'string' ? validatedData.mainColor : undefined,
        snsIconColor:
          typeof validatedData.snsIconColor === 'string' ? validatedData.snsIconColor : undefined,
        phone: typeof validatedData.phone === 'string' ? validatedData.phone : undefined,
        company: typeof validatedData.company === 'string' ? validatedData.company : undefined,
        companyUrl:
          typeof validatedData.companyUrl === 'string' ? validatedData.companyUrl : undefined,
        companyLabel:
          typeof validatedData.companyLabel === 'string' ? validatedData.companyLabel : undefined,
        bioTextColor: typeof validatedData.textColor === 'string' ? validatedData.textColor : undefined,
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