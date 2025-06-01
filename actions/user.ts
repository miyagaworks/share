// actions/user.ts
'use server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { generateSlug } from '@/lib/utils';
import { Profile } from '@prisma/client';
// ユーザー種別に基づくダッシュボードパスを取得
export async function getUserDashboardPath() {
  const session = await auth();
  if (!session?.user?.id) {
    return '/auth/signin';
  }
  // セッションにすでに情報がある場合はそれを使用
  if (session.user.isAdmin) {
    return '/dashboard/corporate';
  }
  if (session.user.tenantId) {
    return '/dashboard/corporate-member';
  }
  // セッションに情報がない場合はDBから取得
  const userId = session.user.id;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
        adminOfTenant: true,
      },
    });
    if (!user) return '/dashboard';
    if (user.adminOfTenant) {
      return '/dashboard/corporate';
    }
    if (user.tenant) {
      return '/dashboard/corporate-member';
    }
    return '/dashboard';
  } catch {
    return '/dashboard';
  }
}
// ユーザー情報をメールアドレスで取得
export async function getUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return { success: true, user };
  } catch {
    return { success: false, error: 'ユーザーの検索に失敗しました' };
  }
}
// ユーザー情報をIDで取得
export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return { success: true, user };
  } catch {
    return { success: false, error: 'ユーザーの検索に失敗しました' };
  }
}
// 現在ログイン中のユーザー情報を取得
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: '認証されていません' };
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        tenant: true,
        adminOfTenant: true,
      },
    });
    return { success: true, user };
  } catch {
    return { success: false, error: 'ユーザー情報の取得に失敗しました' };
  }
}
// プロフィールの作成
export async function createProfile(userId: string) {
  try {
    // プロフィールがすでに存在するか確認
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });
    if (existingProfile) {
      return { success: true, profile: existingProfile };
    }
    // 一意のスラグを生成
    let slug = generateSlug();
    let slugExists = true;
    // スラグがすでに存在する場合は新しいスラグを生成
    while (slugExists) {
      const existingSlug = await prisma.profile.findUnique({
        where: { slug },
      });
      if (!existingSlug) {
        slugExists = false;
      } else {
        slug = generateSlug();
      }
    }
    // プロフィールを作成
    const profile = await prisma.profile.create({
      data: {
        userId,
        slug,
        isPublic: true,
      },
    });
    return { success: true, profile };
  } catch {
    return { success: false, error: 'プロフィールの作成に失敗しました' };
  }
}
// プロフィールの更新
export async function updateProfile(data: {
  name?: string;
  nameEn?: string;
  bio?: string;
  image?: string;
  mainColor?: string;
  phone?: string;
  company?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: '認証が必要です' };
  }
  const userId = session.user.id;
  try {
    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
    });
    // プロフィールがまだない場合は作成
    const profileResult = await createProfile(userId);
    if (!profileResult.success) {
      return profileResult;
    }
    // キャッシュを更新
    revalidatePath('/dashboard/profile');
    return {
      success: true,
      user: updatedUser,
      profile: profileResult.profile,
    };
  } catch {
    return { success: false, error: 'プロフィールの更新に失敗しました' };
  }
}
// プロフィール設定の更新（スラグ、公開/非公開設定など）
export async function updateProfileSettings(data: {
  slug?: string;
  isPublic?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: '認証が必要です' };
  }
  const userId = session.user.id;
  try {
    // プロフィールを取得
    let profile = await prisma.profile.findUnique({
      where: { userId },
    });
    // プロフィールがない場合は作成
    if (!profile) {
      const result = await createProfile(userId);
      if (!result.success) {
        return result;
      }
      // nullの可能性を排除するために型アサーションを使用
      profile = result.profile as Profile;
    }
    // nullチェックを追加
    if (!profile) {
      return { success: false, error: 'プロフィールが見つかりません' };
    }
    // スラグの一意性をチェック
    if (data.slug && data.slug !== profile.slug) {
      const existingSlug = await prisma.profile.findUnique({
        where: { slug: data.slug },
      });
      if (existingSlug) {
        return { success: false, error: 'このスラグは既に使用されています' };
      }
    }
    // プロフィール設定を更新
    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data,
    });
    // キャッシュを更新
    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard/share');
    if (updatedProfile.slug) {
      revalidatePath(`/${updatedProfile.slug}`);
    }
    return { success: true, profile: updatedProfile };
  } catch {
    return { success: false, error: 'プロフィール設定の更新に失敗しました' };
  }
}
// アカウントの削除
export async function deleteUserAccount() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: '認証が必要です' };
  }
  const userId = session.user.id;
  try {
    // 関連データを削除（カスケード削除の設定に依存）
    await prisma.user.delete({
      where: { id: userId },
    });
    return { success: true };
  } catch {
    return { success: false, error: 'アカウントの削除に失敗しました' };
  }
}
// パスワード検証
export async function verifyPassword(password: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: '認証が必要です' };
  }
  // パスワード検証ロジック
  // 注: Next Auth/Prisma Adapterの実装によります
  try {
    const result = await fetch('/api/user/check-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });
    const data = await result.json();
    return data;
  } catch {
    return { success: false, error: 'パスワードの検証に失敗しました' };
  }
}