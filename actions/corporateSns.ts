// actions/corporateSns.ts
'use server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { SNS_PLATFORMS } from '@/types/sns';
import type { CorporateSnsLink } from '@prisma/client';
// 法人共通SNSリンク一覧取得
export async function getCorporateSnsLinks() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: '認証されていません' };
    }
    // ユーザーの法人テナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminOfTenant: true,
        tenant: true,
      },
    });
    if (!user) {
      return { error: 'ユーザーが見つかりません' };
    }
    // テナント情報を取得（管理者または一般メンバーのいずれか）
    const tenant = user.adminOfTenant || user.tenant;
    if (!tenant) {
      return { error: '法人テナント情報が見つかりません' };
    }
    // 法人共通SNSリンクを取得
    // 注: このコメントを取得するにはPrismaクライアントを再生成する必要があります
    const snsLinks = await prisma.corporateSnsLink.findMany({
      where: { tenantId: tenant.id },
      orderBy: { displayOrder: 'asc' },
    });
    return { success: true, snsLinks, isAdmin: !!user.adminOfTenant };
  } catch (error) {
    return { error: '法人共通SNSリンクの取得に失敗しました' };
  }
}
// 法人共通SNSリンク追加
export async function addCorporateSnsLink(data: {
  platform: string;
  username?: string;
  url: string;
  isRequired?: boolean;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: '認証されていません' };
    }
    // 管理者権限の確認
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminOfTenant: true,
      },
    });
    if (!user || !user.adminOfTenant) {
      return { error: 'この操作には管理者権限が必要です' };
    }
    // データの検証
    const validatedFields = z
      .object({
        platform: z.enum(SNS_PLATFORMS),
        username: z.string().optional(),
        url: z.string().url({ message: '有効なURLを入力してください' }),
        isRequired: z.boolean().optional().default(false),
      })
      .safeParse(data);
    if (!validatedFields.success) {
      return { error: '入力データが無効です' };
    }
    // プラットフォームが既に存在するか確認
    const existingLink = await prisma.corporateSnsLink.findFirst({
      where: {
        tenantId: user.adminOfTenant.id,
        platform: data.platform,
      },
    });
    if (existingLink) {
      return { error: 'このプラットフォームは既に追加されています' };
    }
    // 現在のリンク数を取得して表示順を決定
    const currentLinks = await prisma.corporateSnsLink.findMany({
      where: { tenantId: user.adminOfTenant.id },
    });
    const displayOrder = currentLinks.length + 1;
    // SNSリンクを追加
    const newLink = await prisma.corporateSnsLink.create({
      data: {
        tenantId: user.adminOfTenant.id,
        platform: data.platform,
        username: data.username,
        url: data.url,
        displayOrder,
        isRequired: data.isRequired || false,
      },
    });
    // キャッシュを更新
    revalidatePath('/dashboard/corporate/sns');
    revalidatePath('/dashboard/corporate');
    return { success: true, link: newLink };
  } catch (error) {
    return { error: '法人共通SNSリンクの追加に失敗しました' };
  }
}
// 法人共通SNSリンク削除
export async function deleteCorporateSnsLink(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: '認証されていません' };
    }
    // 管理者権限の確認
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminOfTenant: true,
      },
    });
    if (!user || !user.adminOfTenant) {
      return { error: 'この操作には管理者権限が必要です' };
    }
    // リンクが存在するか確認
    const link = await prisma.corporateSnsLink.findFirst({
      where: {
        id,
        tenantId: user.adminOfTenant.id,
      },
    });
    if (!link) {
      return { error: 'リンクが見つかりません' };
    }
    // 必須フラグが設定されていれば削除不可
    if (link.isRequired) {
      return { error: '必須に設定されたリンクは削除できません' };
    }
    // リンクを削除
    await prisma.corporateSnsLink.delete({
      where: { id },
    });
    // 残りのリンクの表示順を再調整
    const remainingLinks = await prisma.corporateSnsLink.findMany({
      where: { tenantId: user.adminOfTenant.id },
      orderBy: { displayOrder: 'asc' },
    });
    // 表示順を更新
    for (let i = 0; i < remainingLinks.length; i++) {
      await prisma.corporateSnsLink.update({
        where: { id: remainingLinks[i].id },
        data: { displayOrder: i + 1 },
      });
    }
    // キャッシュを更新
    revalidatePath('/dashboard/corporate/sns');
    revalidatePath('/dashboard/corporate');
    return { success: true };
  } catch (error) {
    return { error: '法人共通SNSリンクの削除に失敗しました' };
  }
}
// 法人共通SNSリンクの表示順更新
export async function updateCorporateSnsLinkOrder(linkIds: string[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: '認証されていません' };
    }
    // 管理者権限の確認
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminOfTenant: true,
      },
    });
    if (!user || !user.adminOfTenant) {
      return { error: 'この操作には管理者権限が必要です' };
    }
    // 各リンクのIDを検証
    const links = await prisma.corporateSnsLink.findMany({
      where: {
        id: { in: linkIds },
        tenantId: user.adminOfTenant.id,
      },
    });
    if (links.length !== linkIds.length) {
      return { error: '無効なリンクIDが含まれています' };
    }
    // トランザクションで一括更新
    await prisma.$transaction(
      linkIds.map((id, index) =>
        prisma.corporateSnsLink.update({
          where: { id },
          data: { displayOrder: index + 1 },
        }),
      ),
    );
    // キャッシュを更新
    revalidatePath('/dashboard/corporate/sns');
    revalidatePath('/dashboard/corporate');
    return { success: true };
  } catch (error) {
    return { error: '法人共通SNSリンクの順序更新に失敗しました' };
  }
}
// 法人共通SNSリンク更新
export async function updateCorporateSnsLink(
  id: string,
  data: {
    username?: string;
    url: string;
    isRequired?: boolean;
  },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: '認証されていません' };
    }
    // 管理者権限の確認
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminOfTenant: true,
      },
    });
    if (!user || !user.adminOfTenant) {
      return { error: 'この操作には管理者権限が必要です' };
    }
    // リンクが存在するか確認
    const link = await prisma.corporateSnsLink.findFirst({
      where: {
        id,
        tenantId: user.adminOfTenant.id,
      },
    });
    if (!link) {
      return { error: 'リンクが見つかりません' };
    }
    // データの検証
    const validatedFields = z
      .object({
        username: z.string().optional(),
        url: z.string().url({ message: '有効なURLを入力してください' }),
        isRequired: z.boolean().optional(),
      })
      .safeParse(data);
    if (!validatedFields.success) {
      return { error: '入力データが無効です' };
    }
    // リンクを更新
    const updatedLink = await prisma.corporateSnsLink.update({
      where: { id },
      data: {
        username: data.username,
        url: data.url,
        isRequired: data.isRequired !== undefined ? data.isRequired : link.isRequired,
      },
    });
    // キャッシュを更新
    revalidatePath('/dashboard/corporate/sns');
    revalidatePath('/dashboard/corporate');
    return { success: true, link: updatedLink };
  } catch (error) {
    return { error: '法人共通SNSリンクの更新に失敗しました' };
  }
}
// 個人ユーザーのSNSリンク同期処理
export async function syncCorporateSnsToUsers() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: '認証されていません' };
    }
    // 管理者権限の確認
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminOfTenant: true,
      },
    });
    if (!user || !user.adminOfTenant) {
      return { error: 'この操作には管理者権限が必要です' };
    }
    const tenantId = user.adminOfTenant.id;
    // 法人共通SNSリンクを取得
    const corporateSnsLinks = await prisma.corporateSnsLink.findMany({
      where: { tenantId },
      orderBy: { displayOrder: 'asc' },
    });
    if (corporateSnsLinks.length === 0) {
      return { success: true, message: '同期するSNSリンクがありません' };
    }
    // テナントに所属するユーザーを取得
    const tenantUsers = await prisma.user.findMany({
      where: {
        OR: [{ tenantId }, { adminOfTenant: { id: tenantId } }],
      },
      include: {
        snsLinks: true,
      },
    });
    let updatedCount = 0;
    let createdCount = 0;
    // 各ユーザーに対して処理
    for (const tenantUser of tenantUsers) {
      // 既存のSNSリンクマップを作成
      const userSnsLinksMap = new Map(tenantUser.snsLinks.map((link) => [link.platform, link]));
      // 必須の法人共通SNSリンクを追加/更新
      for (const corpLink of corporateSnsLinks.filter(
        (link: CorporateSnsLink) => link.isRequired,
      )) {
        const existingUserLink = userSnsLinksMap.get(corpLink.platform);
        if (existingUserLink) {
          // 既存のリンクを更新
          await prisma.snsLink.update({
            where: { id: existingUserLink.id },
            data: {
              url: corpLink.url,
              username: corpLink.username,
            },
          });
          updatedCount++;
        } else {
          // 新しいリンクを追加
          // 現在のユーザーのSNSリンク最大表示順を取得
          const maxDisplayOrder =
            tenantUser.snsLinks.length > 0
              ? Math.max(...tenantUser.snsLinks.map((link) => link.displayOrder))
              : 0;
          await prisma.snsLink.create({
            data: {
              userId: tenantUser.id,
              platform: corpLink.platform,
              username: corpLink.username,
              url: corpLink.url,
              displayOrder: maxDisplayOrder + 1,
            },
          });
          createdCount++;
        }
      }
    }
    // キャッシュを更新
    revalidatePath('/dashboard/corporate/sns');
    revalidatePath('/dashboard/links');
    return {
      success: true,
      message: `${tenantUsers.length}人のユーザーに対して、${updatedCount}件のリンクを更新、${createdCount}件のリンクを追加しました`,
    };
  } catch (error) {
    return { error: 'SNSリンクの同期に失敗しました' };
  }
}