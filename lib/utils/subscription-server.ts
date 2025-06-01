// lib/utils/subscription-server.ts
import { logger } from "@/lib/utils/logger";
// サーバーサイド専用のサブスクリプション機能
import { prisma } from '@/lib/prisma';
import { addDays } from 'date-fns';
import { sendEmail } from '@/lib/email';
import { getTrialEndingEmailTemplate } from '@/lib/email/templates/trial-ending';
import { getGracePeriodExpiredEmailTemplate } from '@/lib/email/templates/grace-period-expired';
// ユーザーメール送信結果のインターフェース定義を追加
interface EmailResult {
  id: string;
  email: string;
  status: 'success' | 'failed';
  error?: string;
}
// 無料トライアル終了の通知を送信する（サーバーサイド専用）
export async function sendTrialEndingEmails() {
  const now = new Date();
  // 2日後に終了するトライアルを検索
  const twoDaysFromNow = addDays(now, 2);
  const startOfDay = new Date(
    twoDaysFromNow.getFullYear(),
    twoDaysFromNow.getMonth(),
    twoDaysFromNow.getDate(),
  );
  const endOfDay = new Date(
    twoDaysFromNow.getFullYear(),
    twoDaysFromNow.getMonth(),
    twoDaysFromNow.getDate(),
    23,
    59,
    59,
  );
  const users = await prisma.user.findMany({
    where: {
      trialEndsAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      // 既に有効なサブスクリプションがないユーザーのみ
      subscription: {
        is: null,
      },
      // 永久利用権がないユーザーのみ
      subscriptionStatus: {
        not: 'permanent',
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      trialEndsAt: true,
    },
  });
  logger.debug(`トライアル終了2日前のユーザー: ${users.length}人`);
  // 結果を格納する配列 - 具体的な型を指定
  const results = {
    total: users.length,
    success: 0,
    failed: 0,
    users: [] as EmailResult[], // EmailResult[] 型を指定
  };
  // 各ユーザーにメールを送信
  for (const user of users) {
    if (!user.email || !user.trialEndsAt) continue;
    try {
      const emailTemplate = getTrialEndingEmailTemplate({
        userName: user.name || 'ユーザー',
        trialEndDate: user.trialEndsAt,
      });
      await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
      });
      results.success++;
      results.users.push({
        id: user.id,
        email: user.email,
        status: 'success',
      });
      logger.debug(`トライアル終了メール送信成功: ${user.email}`);
    } catch (error) {
      logger.error(`トライアル終了メール送信失敗: ${user.email}`, error);
      results.failed++;
      results.users.push({
        id: user.id,
        email: user.email,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return results;
}
// 猶予期間が過ぎたユーザーをチェックし、管理者に通知する（サーバーサイド専用）
export async function checkExpiredGracePeriods() {
  const now = new Date();
  // トライアル終了から7日以上経過したユーザーを検索
  const users = await prisma.user.findMany({
    where: {
      trialEndsAt: {
        lt: addDays(now, -7), // 7日以上前に終了
      },
      // 既に有効なサブスクリプションがないユーザーのみ
      subscription: {
        is: null,
      },
      // 永久利用権がないユーザーのみ
      subscriptionStatus: {
        not: 'permanent',
      },
      // まだ削除されていないユーザーのみ
      NOT: {
        subscriptionStatus: 'deleted',
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      trialEndsAt: true,
    },
  });
  logger.debug(`猶予期間が過ぎたユーザー: ${users.length}人`);
  if (users.length === 0) {
    return {
      total: 0,
      success: 0,
      message: '猶予期間が過ぎたユーザーはいません',
    };
  }
  // 管理者メールアドレス
  const adminEmail = 'admin@sns-share.com';
  // 猶予期間終了ユーザー情報を整形
  const expiredUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    trialEndDate: user.trialEndsAt as Date,
    gracePeriodEndDate: addDays(user.trialEndsAt as Date, 7),
  }));
  try {
    // 管理者通知メールを送信
    const emailTemplate = getGracePeriodExpiredEmailTemplate({
      expiredUsers,
    });
    await sendEmail({
      to: adminEmail,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    });
    logger.debug(`管理者通知メール送信成功: ${adminEmail}, ユーザー数: ${users.length}`);
    // ユーザーステータスを更新（猶予期間終了マーク）
    await prisma.$transaction(
      users.map((user) =>
        prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: 'grace_period_expired' },
        }),
      ),
    );
    return {
      total: users.length,
      success: 1,
      message: `${users.length}人の猶予期間終了ユーザーについて、管理者に通知しました`,
    };
  } catch (error) {
    logger.error(`管理者通知メール送信失敗:`, error);
    return {
      total: users.length,
      success: 0,
      error: error instanceof Error ? error.message : String(error),
      message: '管理者通知メールの送信に失敗しました',
    };
  }
}