// app/api/subscription/cancel-request/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { getCancelRequestEmailTemplate } from '@/lib/email/templates/cancel-request';
import { getAdminNotificationEmailTemplate } from '@/lib/email/templates/admin-notification';

interface CancelRequestBody {
  cancelDate: string;
  reason?: string;
}

// 返金額計算関数
function calculateRefund(plan: string, interval: string, paidAmount: number, usedMonths: number) {
  // 月額プランは返金なし
  if (interval === 'month') {
    return { refundAmount: 0, usedMonths: 0 };
  }

  // 年額プランの場合
  if (interval === 'year') {
    let monthlyRate = 0;

    // プランごとの月額換算レート
    if (plan === 'yearly' || plan.includes('individual')) {
      monthlyRate = 550; // 個人プラン年額の月額換算
    } else if (plan.includes('starter')) {
      monthlyRate = 3300; // スタータープラン年額の月額換算
    } else if (plan.includes('business')) {
      monthlyRate = 6600; // ビジネスプラン年額の月額換算
    } else if (plan.includes('enterprise')) {
      monthlyRate = 9900; // エンタープライズプラン年額の月額換算
    }

    const usedAmount = usedMonths * monthlyRate;
    const refundAmount = Math.max(0, paidAmount - usedAmount);

    return { refundAmount, usedMonths };
  }

  return { refundAmount: 0, usedMonths: 0 };
}

// プラン表示名を取得
function getPlanDisplayName(plan: string, interval: string) {
  const intervalText = interval === 'year' ? '年額' : '月額';

  if (plan === 'monthly' || plan === 'yearly') {
    return `個人プラン（${intervalText}）`;
  }
  if (plan.includes('starter')) {
    return `法人スタータープラン（${intervalText}）`;
  }
  if (plan.includes('business')) {
    return `法人ビジネスプラン（${intervalText}）`;
  }
  if (plan.includes('enterprise')) {
    return `法人エンタープライズプラン（${intervalText}）`;
  }

  return `${plan}（${intervalText}）`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    const body: CancelRequestBody = await req.json();
    const { cancelDate, reason } = body;

    // バリデーション
    if (!cancelDate) {
      return NextResponse.json({ error: '解約日を選択してください' }, { status: 400 });
    }

    // ユーザーの購読情報を取得
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'ご利用プランが見つかりません' }, { status: 404 });
    }

    // 既に解約申請済みかチェック
    const existingRequest = await prisma.cancelRequest.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['pending', 'approved'] },
      },
    });

    if (existingRequest) {
      return NextResponse.json({ error: '既に解約申請済みです' }, { status: 400 });
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザー情報が見つかりません' }, { status: 404 });
    }

    // 利用開始日からの経過月数を計算
    const startDate = new Date(subscription.currentPeriodStart);
    const requestDate = new Date(cancelDate);
    const usedMonths = Math.ceil(
      (requestDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
    );

    // 支払い済み金額（実際の運用では請求履歴から取得）
    let paidAmount = 0;
    if (subscription.plan === 'monthly') paidAmount = 550;
    else if (subscription.plan === 'yearly') paidAmount = 5500;
    else if (subscription.plan.includes('starter')) {
      paidAmount = subscription.interval === 'year' ? 33000 : 3300;
    } else if (subscription.plan.includes('business')) {
      paidAmount = subscription.interval === 'year' ? 66000 : 6600;
    } else if (subscription.plan.includes('enterprise')) {
      paidAmount = subscription.interval === 'year' ? 99000 : 9900;
    }

    // 返金額計算
    const { refundAmount } = calculateRefund(
      subscription.plan,
      subscription.interval || 'month',
      paidAmount,
      usedMonths,
    );

    // 解約申請をデータベースに保存
    const cancelRequest = await prisma.cancelRequest.create({
      data: {
        userId: session.user.id,
        subscriptionId: subscription.id,
        requestedCancelDate: new Date(cancelDate),
        reason: reason || null,
        currentPlan: subscription.plan,
        currentInterval: subscription.interval || 'month',
        paidAmount,
        refundAmount,
        usedMonths,
        status: 'pending',
      },
    });

    // ユーザーに解約申請受付メールを送信
    try {
      const userEmailTemplate = getCancelRequestEmailTemplate({
        userName: user.name || 'お客様',
        currentPlan: getPlanDisplayName(subscription.plan, subscription.interval || 'month'),
        currentInterval: subscription.interval || 'month',
        cancelDate: new Date(cancelDate),
        paidAmount,
        refundAmount,
        usedMonths,
        reason,
      });

      await sendEmail({
        to: user.email,
        subject: userEmailTemplate.subject,
        html: userEmailTemplate.html,
        text: userEmailTemplate.text,
      });
    } catch (emailError) {
      logger.error('ユーザー向け解約申請メール送信エラー:', emailError);
    }

    // 管理者に通知メールを送信
    try {
      const adminEmailTemplate = getAdminNotificationEmailTemplate({
        subject: '【Share】新しい解約申請',
        title: '新しい解約申請が提出されました',
        message: `ユーザー: ${user.name || '未設定'} (${user.email})
プラン: ${getPlanDisplayName(subscription.plan, subscription.interval || 'month')}
解約希望日: ${new Date(cancelDate).toLocaleDateString('ja-JP')}
返金予定額: ¥${refundAmount.toLocaleString()}
${reason ? `理由: ${reason}` : ''}

管理者ダッシュボードから処理してください。`,
        ctaText: '解約申請を確認する',
        ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/cancel-requests`,
      });

      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@sns-share.com',
        subject: adminEmailTemplate.subject,
        html: adminEmailTemplate.html,
        text: adminEmailTemplate.text,
      });
    } catch (emailError) {
      logger.error('管理者向け解約申請通知メール送信エラー:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: '解約申請を受け付けました',
      cancelRequest: {
        id: cancelRequest.id,
        requestedCancelDate: cancelRequest.requestedCancelDate,
        refundAmount: cancelRequest.refundAmount,
        status: cancelRequest.status,
      },
    });
  } catch (error) {
    logger.error('解約申請エラー:', error);
    return NextResponse.json({ error: '解約申請の処理に失敗しました' }, { status: 500 });
  }
}