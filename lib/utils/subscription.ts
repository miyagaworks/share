// /lib/utils/subscription.ts
import { addDays } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { getTrialEndingEmailTemplate } from '../email/templates/trial-ending';

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

    for (const user of users) {
      if (!user.trialEndsAt) continue;

      try {
        const userName = user.name || 'お客様';
        const { subject, text, html } = getTrialEndingEmailTemplate({
          userName,
          trialEndDate: user.trialEndsAt,
        });

        // メール送信
        const result = await sendEmail({
          to: user.email,
          subject,
          text,
          html,
        });

        console.log(`ユーザー ${user.id} (${user.email}) に通知メールを送信しました。`);

        results.push({
          userId: user.id,
          email: user.email,
          success: true,
          messageId: result.messageId,
        });
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