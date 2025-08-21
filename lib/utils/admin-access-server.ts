// lib/utils/admin-access-server.ts (セキュア版 - 明示的管理)
import { logger } from '@/lib/utils/logger';
import { prisma } from '@/lib/prisma';

// 🔧 設定: スーパー管理者のみ固定
const SUPER_ADMIN_EMAIL = 'admin@sns-share.com';

// 管理者レベルの定義
export type AdminLevel = 'super' | 'financial' | 'none';

/**
 * ユーザーの管理者レベルを取得する（サーバーサイド専用）
 * 🔒 セキュア版: 明示的な管理のみ
 */
export async function getAdminLevel(userId: string | undefined | null): Promise<AdminLevel> {
  if (!userId) return 'none';

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        subscriptionStatus: true,
        isFinancialAdmin: true,
        financialAdminRecord: {
          select: {
            isActive: true,
          },
        },
      },
    });

    if (!user) return 'none';

    const userEmail = user.email.toLowerCase();

    // 条件1: スーパー管理者の判定（固定）
    if (userEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return 'super';
    }

    // 条件2: 永久利用権ユーザーの除外（スーパー管理者以外）
    if (user.subscriptionStatus === 'permanent' && userEmail !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      return 'none';
    }

    // 🔒 修正: 財務管理者は明示的な設定のみで判定
    // ドメインベースの自動権限付与は廃止
    const hasExplicitFinancialAdmin =
      user.isFinancialAdmin && user.financialAdminRecord?.isActive === true;

    if (hasExplicitFinancialAdmin) {
      logger.debug('財務管理者権限確認（明示的設定）:', {
        userEmail,
        isFinancialAdmin: user.isFinancialAdmin,
        hasActiveRecord: user.financialAdminRecord?.isActive,
      });
      return 'financial';
    }

    return 'none';
  } catch (error) {
    logger.error('管理者レベル取得エラー:', error);
    return 'none';
  }
}

/**
 * スーパー管理者かどうかをチェックする
 */
export async function isSuperAdmin(userId: string | undefined | null): Promise<boolean> {
  const level = await getAdminLevel(userId);
  return level === 'super';
}

/**
 * 財務管理者かどうかをチェックする
 */
export async function isFinancialAdmin(userId: string | undefined | null): Promise<boolean> {
  const level = await getAdminLevel(userId);
  return level === 'financial';
}

/**
 * 管理者（スーパー管理者または財務管理者）かどうかをチェックする
 */
export async function isAdminUser(userId: string | undefined | null): Promise<boolean> {
  const level = await getAdminLevel(userId);
  return level === 'super' || level === 'financial';
}

/**
 * 指定された管理者レベル以上の権限があるかチェックする
 */
export async function checkAdminPermission(
  userId: string | undefined | null,
  requiredLevel: 'super' | 'financial',
): Promise<boolean> {
  const userLevel = await getAdminLevel(userId);

  if (requiredLevel === 'super') {
    return userLevel === 'super';
  } else if (requiredLevel === 'financial') {
    return userLevel === 'super' || userLevel === 'financial';
  }

  return false;
}

/**
 * ユーザーの管理者情報を取得する
 */
export async function getAdminInfo(userId: string | undefined | null): Promise<{
  isSuperAdmin: boolean;
  isFinancialAdmin: boolean;
  userType: 'super_admin' | 'financial_admin' | 'user';
}> {
  if (!userId) {
    return {
      isSuperAdmin: false,
      isFinancialAdmin: false,
      userType: 'user',
    };
  }

  const adminLevel = await getAdminLevel(userId);

  return {
    isSuperAdmin: adminLevel === 'super',
    isFinancialAdmin: adminLevel === 'financial',
    userType:
      adminLevel === 'super'
        ? 'super_admin'
        : adminLevel === 'financial'
          ? 'financial_admin'
          : 'user',
  };
}

/**
 * 財務管理者を追加する（スーパー管理者のみ実行可能）
 * 🔒 セキュリティ強化版
 */
export async function addFinancialAdmin(
  executorUserId: string,
  targetUserId: string,
  notes?: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // 🔒 実行者がスーパー管理者かチェック
    const isSuperAdminExecutor = await isSuperAdmin(executorUserId);
    if (!isSuperAdminExecutor) {
      return { success: false, message: 'スーパー管理者権限が必要です' };
    }

    // 対象ユーザーの存在確認
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        isFinancialAdmin: true,
        subscriptionStatus: true,
        financialAdminRecord: {
          select: {
            isActive: true,
          },
        },
      },
    });

    if (!targetUser) {
      return { success: false, message: '対象ユーザーが見つかりません' };
    }

    // 🔒 重要: admin@sns-share.com は財務管理者に設定不可
    if (targetUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return { success: false, message: 'スーパー管理者は財務管理者に設定できません' };
    }

    // 永久利用権ユーザーは財務管理者にできない
    if (targetUser.subscriptionStatus === 'permanent') {
      return { success: false, message: '永久利用権ユーザーは財務管理者に設定できません' };
    }

    // 既に財務管理者の場合
    if (targetUser.isFinancialAdmin && targetUser.financialAdminRecord?.isActive) {
      return { success: false, message: '既に財務管理者に設定されています' };
    }

    // トランザクションで財務管理者を追加
    await prisma.$transaction(async (tx: any) => {
      // 既存の無効なレコードがあれば削除
      await tx.financialAdmin.deleteMany({
        where: { userId: targetUserId },
      });

      // 🔧 修正: ユーザーテーブルのフラグとsubscriptionStatusを更新
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          isFinancialAdmin: true,
          subscriptionStatus: 'active', // ← この行を追加
        },
      });

      // 新しい財務管理者レコードを作成
      await tx.financialAdmin.create({
        data: {
          userId: targetUserId,
          addedBy: executorUserId,
          notes: notes || null,
          isActive: true,
        },
      });
    });

    logger.info('財務管理者を追加しました:', {
      targetUserId,
      targetEmail: targetUser.email,
      executorUserId,
      subscriptionStatusUpdated: 'active',
    });

    return { success: true, message: '財務管理者を追加しました' };
  } catch (error) {
    logger.error('財務管理者追加エラー:', error);
    return { success: false, message: '財務管理者の追加に失敗しました' };
  }
}

/**
 * 財務管理者を削除する（スーパー管理者のみ実行可能）
 */
export async function removeFinancialAdmin(
  executorUserId: string,
  targetUserId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // 実行者がスーパー管理者かチェック
    const isSuperAdminExecutor = await isSuperAdmin(executorUserId);
    if (!isSuperAdminExecutor) {
      return { success: false, message: 'スーパー管理者権限が必要です' };
    }

    // 対象ユーザーの存在確認
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        isFinancialAdmin: true,
        subscriptionStatus: true,
        subscription: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!targetUser) {
      return { success: false, message: '対象ユーザーが見つかりません' };
    }

    if (!targetUser.isFinancialAdmin) {
      return { success: false, message: '対象ユーザーは財務管理者ではありません' };
    }

    // 🔧 修正: 削除後の適切なsubscriptionStatusを決定
    let newSubscriptionStatus = 'active';

    // ユーザーのサブスクリプション状況に応じて適切な状態を設定
    if (targetUser.subscription?.status) {
      newSubscriptionStatus = targetUser.subscription.status;
    } else {
      // サブスクリプションがない場合は trialing に戻す
      newSubscriptionStatus = 'trialing';
    }

    // トランザクションで財務管理者を削除
    await prisma.$transaction(async (tx: any) => {
      // 🔧 修正: ユーザーテーブルのフラグとsubscriptionStatusを更新
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          isFinancialAdmin: false,
          subscriptionStatus: newSubscriptionStatus, // ← 適切な状態に戻す
        },
      });

      // FinancialAdminレコードを完全削除
      await tx.financialAdmin.deleteMany({
        where: { userId: targetUserId },
      });
    });

    logger.info('財務管理者を削除しました:', {
      targetUserId,
      targetEmail: targetUser.email,
      executorUserId,
      subscriptionStatusReverted: newSubscriptionStatus,
    });

    return { success: true, message: '財務管理者を削除しました' };
  } catch (error) {
    logger.error('財務管理者削除エラー:', error);
    return { success: false, message: '財務管理者の削除に失敗しました' };
  }
}

/**
 * 財務管理者一覧を取得する（スーパー管理者のみ実行可能）
 */
export async function getFinancialAdmins(executorUserId: string) {
  try {
    // 実行者がスーパー管理者かチェック
    const isSuperAdminExecutor = await isSuperAdmin(executorUserId);
    if (!isSuperAdminExecutor) {
      throw new Error('スーパー管理者権限が必要です');
    }

    const financialAdmins = await prisma.financialAdmin.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        addedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    return financialAdmins;
  } catch (error) {
    logger.error('財務管理者一覧取得エラー:', error);
    throw error;
  }
}

/**
 * 後方互換性のための関数
 */
export async function isSuperAdminUser(userId: string | undefined | null): Promise<boolean> {
  return await isSuperAdmin(userId);
}

export async function isFinancialAdminUser(userId: string | undefined | null): Promise<boolean> {
  return await isFinancialAdmin(userId);
}