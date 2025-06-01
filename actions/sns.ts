// actions/sns.ts (修正版 - キャッシュ整合性の改善)
'use server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { SNS_PLATFORMS } from '@/types/sns';
// SNSリンク追加 (修正版)
export async function addSnsLink(data: { platform: string; username?: string; url: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: '認証されていません' };
    }
    // データの検証
    const validatedFields = z
      .object({
        platform: z.enum(SNS_PLATFORMS),
        username: z.string().optional(),
        url: z.string().url({ message: '有効なURLを入力してください' }),
      })
      .safeParse(data);
    if (!validatedFields.success) {
      return { error: '入力データが無効です' };
    }
    // プラットフォームが既に存在するか確認
    const existingLink = await prisma.snsLink.findFirst({
      where: {
        userId: session.user.id,
        platform: data.platform,
      },
    });
    if (existingLink) {
      return { error: 'このプラットフォームは既に追加されています' };
    }
    // 現在のリンク数を取得して表示順を決定
    const currentLinks = await prisma.snsLink.findMany({
      where: { userId: session.user.id },
    });
    const displayOrder = currentLinks.length + 1;
    // SNSリンクを追加
    const newLink = await prisma.snsLink.create({
      data: {
        userId: session.user.id,
        platform: data.platform,
        username: data.username,
        url: data.url,
        displayOrder,
      },
    });
    // 🚀 改善: より包括的なキャッシュクリア
    try {
      // 関連するすべてのパスを無効化
      revalidatePath('/dashboard/links', 'page');
      revalidatePath('/dashboard', 'page');
      revalidatePath('/api/links', 'page');
      // ユーザー固有のプロフィールページも無効化
      if (session.user.id) {
        revalidatePath(`/api/user/${session.user.id}/profile`, 'page');
      }
      // タグベースの無効化
      revalidateTag('user-links');
      revalidateTag(`user-${session.user.id}-links`);
      revalidateTag('sns-links');
    } catch (revalidateError) {
      // revalidationエラーがあっても処理は継続
    }

    return { success: true, link: newLink };
  } catch (error) {
    return { error: 'SNSリンクの追加に失敗しました' };
  }
}
// カスタムリンク追加 (修正版)
export async function addCustomLink(data: { name: string; url: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: '認証されていません' };
    }
    // データの検証
    const validatedFields = z
      .object({
        name: z.string().min(1, { message: '名前を入力してください' }),
        url: z.string().url({ message: '有効なURLを入力してください' }),
      })
      .safeParse(data);
    if (!validatedFields.success) {
      return { error: '入力データが無効です' };
    }
    // 現在のリンク数を取得して表示順を決定
    const currentLinks = await prisma.customLink.findMany({
      where: { userId: session.user.id },
    });
    const displayOrder = currentLinks.length + 1;
    // カスタムリンクを追加
    const newLink = await prisma.customLink.create({
      data: {
        userId: session.user.id,
        name: data.name,
        url: data.url,
        displayOrder,
      },
    });
    // 🚀 改善: より包括的なキャッシュクリア
    try {
      // 関連するすべてのパスを無効化
      revalidatePath('/dashboard/links', 'page');
      revalidatePath('/dashboard', 'page');
      revalidatePath('/api/links', 'page');
      // ユーザー固有のプロフィールページも無効化
      if (session.user.id) {
        revalidatePath(`/api/user/${session.user.id}/profile`, 'page');
      }
      // タグベースの無効化
      revalidateTag('user-links');
      revalidateTag(`user-${session.user.id}-links`);
      revalidateTag('custom-links');
    } catch (revalidateError) {
      // revalidationエラーがあっても処理は継続
    }

    return { success: true, link: newLink };
  } catch (error) {
    return { error: 'カスタムリンクの追加に失敗しました' };
  }
}
// SNSリンク削除
export async function deleteSnsLink(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: '認証されていません' };
    }
    // リンクが存在するか確認
    const link = await prisma.snsLink.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });
    if (!link) {
      return { error: 'リンクが見つかりません' };
    }
    // リンクを削除
    await prisma.snsLink.delete({
      where: { id },
    });
    // 残りのリンクの表示順を再調整
    const remainingLinks = await prisma.snsLink.findMany({
      where: { userId: session.user.id },
      orderBy: { displayOrder: 'asc' },
    });
    // 表示順を更新
    for (let i = 0; i < remainingLinks.length; i++) {
      await prisma.snsLink.update({
        where: { id: remainingLinks[i].id },
        data: { displayOrder: i + 1 },
      });
    }
    // キャッシュを更新
    try {
      revalidatePath('/dashboard/links', 'page');
      revalidatePath('/dashboard', 'page');
      revalidatePath('/api/links', 'page');
      // タグベースの無効化
      revalidateTag('user-links');
      revalidateTag(`user-${session.user.id}-links`);
      revalidateTag('sns-links');
    } catch (revalidateError) {
    }
    return { success: true };
  } catch (error) {
    return { error: 'SNSリンクの削除に失敗しました' };
  }
}
// SNSリンクの表示順更新
export async function updateSnsLinkOrder(linkIds: string[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: '認証されていません' };
    }
    // 各リンクのIDを検証
    const links = await prisma.snsLink.findMany({
      where: {
        id: { in: linkIds },
        userId: session.user.id,
      },
    });
    if (links.length !== linkIds.length) {
      return { error: '無効なリンクIDが含まれています' };
    }
    // トランザクションで一括更新
    await prisma.$transaction(
      linkIds.map((id, index) =>
        prisma.snsLink.update({
          where: { id },
          data: { displayOrder: index + 1 },
        }),
      ),
    );
    // キャッシュを更新
    try {
      revalidatePath('/dashboard/links', 'page');
      revalidatePath('/dashboard', 'page');
      revalidatePath('/api/links', 'page');
      revalidateTag('user-links');
      revalidateTag(`user-${session.user.id}-links`);
      revalidateTag('sns-links');
    } catch (revalidateError) {
    }
    return { success: true };
  } catch (error) {
    return { error: 'SNSリンクの順序更新に失敗しました' };
  }
}
// SNSリンク更新（修正版）
export async function updateSnsLink(
  id: string,
  data: {
    username?: string;
    url: string;
  },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: '認証されていません' };
    }
    // データの検証
    const validatedFields = z
      .object({
        username: z.string().optional(),
        url: z.string().url({ message: '有効なURLを入力してください' }),
      })
      .safeParse(data);
    if (!validatedFields.success) {
      return { error: '入力データが無効です' };
    }
    // リンクが存在するか確認
    const link = await prisma.snsLink.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });
    if (!link) {
      return { error: 'リンクが見つかりません' };
    }
    // データベースを更新
    const updatedLink = await prisma.snsLink.update({
      where: { id },
      data: {
        username: validatedFields.data.username,
        url: validatedFields.data.url,
      },
    });
    // キャッシュを更新
    try {
      revalidatePath('/dashboard/links', 'page');
      revalidatePath('/dashboard', 'page');
      revalidatePath('/api/links', 'page');
      revalidateTag('user-links');
      revalidateTag(`user-${session.user.id}-links`);
      revalidateTag('sns-links');
    } catch (revalidateError) {
    }
    return { success: true, link: updatedLink };
  } catch (error) {
    return { error: 'SNSリンクの更新に失敗しました' };
  }
}
// カスタムリンク削除
export async function deleteCustomLink(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: '認証されていません' };
    }
    // リンクが存在するか確認
    const link = await prisma.customLink.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });
    if (!link) {
      return { error: 'リンクが見つかりません' };
    }
    // リンクを削除
    await prisma.customLink.delete({
      where: { id },
    });
    // 残りのリンクの表示順を再調整
    const remainingLinks = await prisma.customLink.findMany({
      where: { userId: session.user.id },
      orderBy: { displayOrder: 'asc' },
    });
    // 表示順を更新
    for (let i = 0; i < remainingLinks.length; i++) {
      await prisma.customLink.update({
        where: { id: remainingLinks[i].id },
        data: { displayOrder: i + 1 },
      });
    }
    // キャッシュを更新
    try {
      revalidatePath('/dashboard/links', 'page');
      revalidatePath('/dashboard', 'page');
      revalidatePath('/api/links', 'page');
      revalidateTag('user-links');
      revalidateTag(`user-${session.user.id}-links`);
      revalidateTag('custom-links');
    } catch (revalidateError) {
    }
    return { success: true };
  } catch (error) {
    return { error: 'カスタムリンクの削除に失敗しました' };
  }
}
// カスタムリンクの表示順更新
export async function updateCustomLinkOrder(linkIds: string[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: '認証されていません' };
    }
    // 各リンクのIDを検証
    const links = await prisma.customLink.findMany({
      where: {
        id: { in: linkIds },
        userId: session.user.id,
      },
    });
    if (links.length !== linkIds.length) {
      return { error: '無効なリンクIDが含まれています' };
    }
    // トランザクションで一括更新
    await prisma.$transaction(
      linkIds.map((id, index) =>
        prisma.customLink.update({
          where: { id },
          data: { displayOrder: index + 1 },
        }),
      ),
    );
    // キャッシュを更新
    try {
      revalidatePath('/dashboard/links', 'page');
      revalidatePath('/dashboard', 'page');
      revalidatePath('/api/links', 'page');
      revalidateTag('user-links');
      revalidateTag(`user-${session.user.id}-links`);
      revalidateTag('custom-links');
    } catch (revalidateError) {
    }
    return { success: true };
  } catch (error) {
    return { error: 'カスタムリンクの順序更新に失敗しました' };
  }
}
// カスタムリンク更新（修正版）
export async function updateCustomLink(
  id: string,
  data: {
    name: string;
    url: string;
  },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: '認証されていません' };
    }
    // データの検証
    const validatedFields = z
      .object({
        name: z.string().min(1, { message: '名前を入力してください' }),
        url: z.string().url({ message: '有効なURLを入力してください' }),
      })
      .safeParse(data);
    if (!validatedFields.success) {
      return { error: '入力データが無効です' };
    }
    // リンクが存在するか確認
    const link = await prisma.customLink.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });
    if (!link) {
      return { error: 'リンクが見つかりません' };
    }
    // データベースを更新
    const updatedLink = await prisma.customLink.update({
      where: { id },
      data: {
        name: validatedFields.data.name,
        url: validatedFields.data.url,
      },
    });
    // キャッシュを更新
    try {
      revalidatePath('/dashboard/links', 'page');
      revalidatePath('/dashboard', 'page');
      revalidatePath('/api/links', 'page');
      revalidateTag('user-links');
      revalidateTag(`user-${session.user.id}-links`);
      revalidateTag('custom-links');
    } catch (revalidateError) {
    }
    return { success: true, link: updatedLink };
  } catch (error) {
    return { error: 'カスタムリンクの更新に失敗しました' };
  }
}