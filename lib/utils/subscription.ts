// lib/utils/subscription.ts
import { addDays } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { getTrialEndingEmailTemplate } from '../email/templates/trial-ending';
import { Resend } from 'resend';

// Resendインスタンスを初期化
const resend = new Resend(process.env.RESEND_API_KEY);

// トライアル終了2日前のユーザーを取得
export async function getUsersWithTrialEndingSoon() {
  // 2日後にトライアルが終了するユーザーを検索
  const targetDate = addDays(new Date(), 2);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const users = await prisma.user.findMany({
      where: {
        trialEndsAt: {
          not: null,
          // 終了日が今から2日後（その日の範囲内）のユーザー
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        trialEndsAt: true,
      },
    });

    return users;
  } catch (error) {
    console.error('トライアル終了予定ユーザー取得エラー:', error);
    return [];
  }
}

// トライアル終了通知メールを送信
export async function sendTrialEndingEmails() {
  try {
    const users = await getUsersWithTrialEndingSoon();
    console.log(`トライアル終了間近のユーザー: ${users.length}人`);

    const results = [];
    const siteName = 'Share';

    for (const user of users) {
      if (!user.trialEndsAt) continue;

      try {
        const userName = user.name || 'お客様';
        const { subject, html, text } = getTrialEndingEmailTemplate({
          userName,
          trialEndDate: user.trialEndsAt,
        });

        // Resendを使用してメール送信
        const { data, error } = await resend.emails.send({
          from: `${siteName} <noreply@sns-share.com>`, // 検証済みドメインのメールアドレス
          to: [user.email],
          subject: subject,
          html: html,
          text: text, // プレーンテキスト版も含める
        });

        if (error) {
          console.error(`ユーザー ${user.id} へのメール送信エラー:`, error);
          results.push({
            userId: user.id,
            email: user.email,
            success: false,
            error: error.message,
          });
        } else {
          console.log(
            `ユーザー ${user.id} (${user.email}) に通知メールを送信しました。ID: ${data?.id}`,
          );
          results.push({
            userId: user.id,
            email: user.email,
            success: true,
            messageId: data?.id,
          });
        }
      } catch (emailError) {
        console.error(`ユーザー ${user.id} へのメール送信エラー:`, emailError);
        results.push({
          userId: user.id,
          email: user.email,
          success: false,
          error: emailError instanceof Error ? emailError.message : String(emailError),
        });
      }
    }

    return {
      totalUsers: users.length,
      results,
    };
  } catch (error) {
    console.error('トライアル終了通知処理エラー:', error);
    throw error;
  }
}

// 猶予期間の長さ（日数）
export const GRACE_PERIOD_DAYS = 7;

// 簡略化したサブスクリプション型
interface SubscriptionInfo {
  status?: string;
}

// ユーザーが猶予期間中かどうかを判定する関数
export function isInGracePeriod(
  trialEndsAt: Date | null, 
  subscription: SubscriptionInfo | null
): boolean {
  if (!trialEndsAt) return false;
  
  // 現在の日時
  const now = new Date();
  
  // アクティブなサブスクリプションがある場合は猶予期間ではない
  if (subscription && 
      (subscription.status === 'active' || 
       subscription.status === 'trialing')) {
    return false;
  }
  
  // トライアル終了日
  const trialEndDate = new Date(trialEndsAt);
  
  // 猶予期間終了日 = トライアル終了日 + 猶予期間日数
  const graceEndDate = new Date(trialEndDate);
  graceEndDate.setDate(graceEndDate.getDate() + GRACE_PERIOD_DAYS);
  
  // 現在が、トライアル終了後かつ猶予期間終了前ならtrue
  return now > trialEndDate && now < graceEndDate;
}

// 猶予期間の残り日数を計算する関数
export function getRemainingGraceDays(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0;
  
  const now = new Date();
  const trialEndDate = new Date(trialEndsAt);
  
  // トライアルがまだ終了していない場合
  if (now < trialEndDate) return GRACE_PERIOD_DAYS;
  
  // 猶予期間終了日
  const graceEndDate = new Date(trialEndDate);
  graceEndDate.setDate(graceEndDate.getDate() + GRACE_PERIOD_DAYS);
  
  // トライアルが終了し、猶予期間中の場合
  if (now <= graceEndDate) {
    const diffTime = graceEndDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
  
  // 猶予期間も終了している場合
  return 0;
}

// 猶予期間が終了しているかどうかを判定する関数
export function isGracePeriodExpired(trialEndsAt: Date | null): boolean {
  if (!trialEndsAt) return false;
  
  const now = new Date();
  const trialEndDate = new Date(trialEndsAt);
  
  // 猶予期間終了日
  const graceEndDate = new Date(trialEndDate);
  graceEndDate.setDate(graceEndDate.getDate() + GRACE_PERIOD_DAYS);
  
  // 現在が猶予期間終了後ならtrue
  return now > graceEndDate;
}