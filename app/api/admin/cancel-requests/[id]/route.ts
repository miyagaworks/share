// app/api/admin/cancel-requests/[id]/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { sendEmail } from '@/lib/email';
import { getAdminNotificationEmailTemplate } from '@/lib/email/templates/admin-notification';

// 管理者権限チェック
async function checkAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  return user?.email === process.env.ADMIN_EMAIL || user?.email === 'admin@sns-share.com';
}

// 解約申請処理
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // paramsを非同期で取得
    const params = await context.params;

    // 管理者権限チェック
    const isAdmin = await checkAdminAccess(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const { action, adminNotes } = await req.json();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: '無効なアクションです' }, { status: 400 });
    }

    // 解約申請を取得
    const cancelRequest = await prisma.cancelRequest.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        subscription: true,
      },
    });

    if (!cancelRequest) {
      return NextResponse.json({ error: '解約申請が見つかりません' }, { status: 404 });
    }

    if (cancelRequest.status !== 'pending') {
      return NextResponse.json({ error: '既に処理済みです' }, { status: 400 });
    }

    // 解約申請を更新
    const updatedRequest = await prisma.cancelRequest.update({
      where: { id: params.id },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        adminNotes: adminNotes || null,
        processedBy: session.user.id,
        processedAt: new Date(),
      },
    });

    // 承認の場合は実際の解約処理を実行
    if (action === 'approve') {
      await prisma.subscription.update({
        where: { id: cancelRequest.subscriptionId },
        data: {
          cancelAtPeriodEnd: true,
          cancelReason: `管理者承認による解約 (申請ID: ${params.id})`,
          updatedAt: new Date(),
        },
      });
    }

    // ユーザーに結果通知メールを送信
    try {
      const emailTemplate = getAdminNotificationEmailTemplate({
        subject: `【Share】解約申請${action === 'approve' ? '承認' : '却下'}のお知らせ`,
        title: `解約申請が${action === 'approve' ? '承認' : '却下'}されました`,
        userName: cancelRequest.user.name || 'お客様',
        message:
          action === 'approve'
            ? `解約申請を承認いたしました。
解約処理を実行し、${cancelRequest.refundAmount > 0 ? 'ご返金の手続きを' : ''}進めさせていただきます。

解約希望日: ${new Date(cancelRequest.requestedCancelDate).toLocaleDateString('ja-JP')}
${cancelRequest.refundAmount > 0 ? `返金予定額: ¥${cancelRequest.refundAmount.toLocaleString()}` : ''}

${cancelRequest.refundAmount > 0 ? 'ご返金には5-10営業日程度お時間をいただきます。' : ''}
ご不明な点がございましたら、お気軽にお問い合わせください。`
            : `解約申請を却下いたしました。

却下理由: ${adminNotes || '記載なし'}

ご不明な点がございましたら、お気軽にお問い合わせください。`,
        ctaText: action === 'approve' ? undefined : 'ダッシュボードを確認',
        ctaUrl:
          action === 'approve'
            ? undefined
            : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
      });

      await sendEmail({
        to: cancelRequest.user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
    } catch (emailError) {
      logger.error('解約申請結果通知メール送信エラー:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: `解約申請を${action === 'approve' ? '承認' : '却下'}しました`,
      request: updatedRequest,
    });
  } catch (error) {
    logger.error('解約申請処理エラー:', error);
    return NextResponse.json({ error: '解約申請の処理に失敗しました' }, { status: 500 });
  }
}