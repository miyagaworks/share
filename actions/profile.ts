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
  // デバッグ用
  Object.entries(data).forEach(([key, value]) => {
    // nullはそのまま渡す（ProfileSchemaでnullableに設定されているため）
    // ただし、name フィールドのみ例外的に処理（nullableではないため）
    if (value === null && key === 'name') {
      sanitizedData[key] = undefined;
    } else {
      sanitizedData[key] = value;
    }
  });
  // デバッグ用
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
    // シンプルなヘルパー関数 - nullはundefinedに変換
    function safeStringField(value: unknown): string | undefined {
      if (typeof value === 'string') {
        return value;
      }
      // nullとundefinedはどちらもundefinedとして扱う
      return undefined;
    }
    // updateProfile 関数内の更新ロジックを修正
    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        // 結合したフィールド
        name,
        nameKana,
        // 分割したフィールド - シンプルなヘルパー関数を使用
        lastName: safeStringField(validatedData.lastName),
        firstName: safeStringField(validatedData.firstName),
        lastNameKana: safeStringField(validatedData.lastNameKana),
        firstNameKana: safeStringField(validatedData.firstNameKana),
        // 英語名
        nameEn: safeStringField(validatedData.nameEn),
        // その他のフィールド
        bio: safeStringField(validatedData.bio),
        image: safeStringField(validatedData.image),
        mainColor: safeStringField(validatedData.mainColor),
        snsIconColor: safeStringField(validatedData.snsIconColor),
        phone: safeStringField(validatedData.phone),
        company: safeStringField(validatedData.company),
        companyUrl: safeStringField(validatedData.companyUrl),
        companyLabel: safeStringField(validatedData.companyLabel),
        bioTextColor: safeStringField(validatedData.bioTextColor),
        headerText: safeStringField(validatedData.headerText),
        textColor: safeStringField(validatedData.textColor),
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
  } catch {
    return { error: 'プロフィールの更新に失敗しました' };
  }
}