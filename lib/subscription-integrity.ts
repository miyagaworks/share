// lib/subscription-integrity.ts - データ整合性チェックと修復機能

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

interface IntegrityIssue {
  userId: string;
  email: string;
  issue: string;
  userSubscriptionStatus: string | null;
  subscriptionStatus?: string;
  trialEndsAt?: Date | null;
}

export async function checkSubscriptionIntegrity(): Promise<IntegrityIssue[]> {
  logger.info('サブスクリプション整合性チェック開始');

  const issues: IntegrityIssue[] = [];

  // 🔍 Issue 1: トライアルユーザーなのにpendingなSubscriptionを持っている
  const trialUsersWithPendingSubscriptions = await prisma.user.findMany({
    where: {
      subscriptionStatus: 'trialing',
      subscription: {
        status: 'pending',
      },
    },
    include: {
      subscription: true,
    },
  });

  for (const user of trialUsersWithPendingSubscriptions) {
    issues.push({
      userId: user.id,
      email: user.email,
      issue: 'trial_user_with_pending_subscription',
      userSubscriptionStatus: user.subscriptionStatus,
      subscriptionStatus: user.subscription?.status,
      trialEndsAt: user.trialEndsAt,
    });
  }

  // 🔍 Issue 2: 有効なトライアル期間があるのにpendingなSubscription
  const now = new Date();
  const activeTrialUsersWithPendingSubscriptions = await prisma.user.findMany({
    where: {
      subscriptionStatus: 'trialing',
      trialEndsAt: {
        gt: now, // トライアル期間がまだ有効
      },
      subscription: {
        status: 'pending',
      },
    },
    include: {
      subscription: true,
    },
  });

  for (const user of activeTrialUsersWithPendingSubscriptions) {
    issues.push({
      userId: user.id,
      email: user.email,
      issue: 'active_trial_with_pending_subscription',
      userSubscriptionStatus: user.subscriptionStatus,
      subscriptionStatus: user.subscription?.status,
      trialEndsAt: user.trialEndsAt,
    });
  }

  logger.info(`整合性チェック完了: ${issues.length}件の問題を発見`);
  return issues;
}

export async function fixSubscriptionIntegrity(issues: IntegrityIssue[]): Promise<void> {
  logger.info(`整合性修復開始: ${issues.length}件の問題を修復中`);

  for (const issue of issues) {
    try {
      switch (issue.issue) {
        case 'trial_user_with_pending_subscription':
        case 'active_trial_with_pending_subscription':
          // トライアルユーザーのpendingなSubscriptionを削除またはtrialingに修正
          await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
              where: { id: issue.userId },
              include: { subscription: true },
            });

            if (!user) return;

            // トライアル期間をチェック
            const now = new Date();
            const isTrialActive = user.trialEndsAt && now < user.trialEndsAt;

            if (isTrialActive && user.subscriptionStatus === 'trialing') {
              // トライアル期間中の場合：pendingなSubscriptionを削除
              if (user.subscription && user.subscription.status === 'pending') {
                await tx.subscription.delete({
                  where: { userId: user.id },
                });

                logger.info(
                  `修復完了: トライアルユーザー ${user.email} のpendingなSubscriptionを削除`,
                );
              }
            }
          });
          break;

        default:
          logger.warn(`未知の問題タイプ: ${issue.issue}`);
      }
    } catch (error) {
      logger.error(`修復エラー (${issue.userId}):`, error);
    }
  }

  logger.info('整合性修復完了');
}

// API endpoint用の関数
export async function runIntegrityCheckAndFix(): Promise<{
  issuesFound: number;
  issuesFixed: number;
  issues: IntegrityIssue[];
}> {
  const issues = await checkSubscriptionIntegrity();

  if (issues.length > 0) {
    await fixSubscriptionIntegrity(issues);
  }

  return {
    issuesFound: issues.length,
    issuesFixed: issues.length,
    issues,
  };
}