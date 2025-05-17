// app/api/admin/email/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminUser } from '@/lib/utils/admin-access';
import { sendEmail } from '@/lib/email';
import { getAdminNotificationEmailTemplate } from '@/lib/email/templates/admin-notification';
import { withIdempotency } from '@/lib/utils/idempotency';

export const POST = withIdempotency(async (request: Request) => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 管理者チェック
    const isAdmin = await isAdminUser(session.user.id);

    if (!isAdmin) {
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 });
    }

    // リクエストボディを取得
    const body = (await request.json()) as {
      subject: string;
      title: string;
      message: string;
      targetGroup: string; // 'all', 'active', 'trial', 'premium', 'permanent'
      ctaText?: string;
      ctaUrl?: string;
    };
    const { subject, title, message, targetGroup, ctaText, ctaUrl } = body;

    // 必須項目のバリデーション
    if (!subject || !title || !message || !targetGroup) {
      return NextResponse.json(
        { error: '件名、タイトル、メッセージ、ターゲットグループは必須です' },
        { status: 400 },
      );
    }

    // ターゲットグループに基づいてユーザーを取得
    let users;
    switch (targetGroup) {
      case 'all':
        users = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        break;

      case 'active':
        users = await prisma.user.findMany({
          where: {
            OR: [
              { subscriptionStatus: 'active' },
              {
                subscription: {
                  status: 'active',
                },
              },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        break;

      case 'inactive':
        users = await prisma.user.findMany({
          where: {
            OR: [
              { subscriptionStatus: 'inactive' },
              {
                subscription: {
                  status: 'canceled',
                },
              },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        break;

      case 'trial':
        users = await prisma.user.findMany({
          where: {
            OR: [
              { subscriptionStatus: 'trialing' },
              {
                subscription: {
                  status: 'trialing',
                },
              },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        break;

      case 'permanent':
        users = await prisma.user.findMany({
          where: {
            subscriptionStatus: 'permanent',
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        break;

      case 'individual':
        users = await prisma.user.findMany({
          where: {
            subscription: {
              plan: {
                in: ['monthly', 'yearly', 'standard', 'premium'],
              },
              corporateTenant: null, // 法人テナント関連なし
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        break;

      case 'individual_monthly':
        users = await prisma.user.findMany({
          where: {
            subscription: {
              plan: {
                in: ['monthly', 'standard'],
              },
              interval: 'month',
              corporateTenant: null, // 法人テナント関連なし
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        break;

      case 'individual_yearly':
        users = await prisma.user.findMany({
          where: {
            subscription: {
              plan: {
                in: ['yearly', 'premium'],
              },
              interval: 'year',
              corporateTenant: null, // 法人テナント関連なし
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        break;

      case 'corporate':
        // 法人の管理者のみ
        users = await prisma.user.findMany({
          where: {
            corporateRole: 'admin',
            tenant: {
              isNot: null,
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        break;

      case 'corporate_monthly':
        // 法人の管理者（月次プラン）
        users = await prisma.user.findMany({
          where: {
            corporateRole: 'admin',
            tenant: {
              subscription: {
                interval: 'month',
              },
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        break;

      case 'corporate_yearly':
        // 法人の管理者（年次プラン）
        users = await prisma.user.findMany({
          where: {
            corporateRole: 'admin',
            tenant: {
              subscription: {
                interval: 'year',
              },
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        break;

      case 'expired':
        users = await prisma.user.findMany({
          where: {
            OR: [
              { subscriptionStatus: 'grace_period_expired' },
              {
                subscription: {
                  canceledAt: {
                    not: null,
                  },
                  currentPeriodEnd: {
                    lt: new Date(),
                  },
                },
              },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: '無効なターゲットグループが指定されました' },
          { status: 400 },
        );
    }

    // ユーザーが見つからない場合
    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: '指定されたグループに該当するユーザーが見つかりません' },
        { status: 404 },
      );
    }

    console.log('メール送信開始:', {
      targetGroup,
      userCount: users.length,
      sampleEmails: users.slice(0, 3).map((u) => u.email),
    });

    // 送信処理をトランザクション内で実行
    const result = await prisma.$transaction(async (tx) => {
      // メール送信ログの作成
      const emailLog = await tx.adminEmailLog.create({
        data: {
          subject,
          title,
          message,
          targetGroup,
          ctaText: ctaText || null,
          ctaUrl: ctaUrl || null,
          sentCount: 0,
          failCount: 0,
          sentBy: session.user.id,
          sentAt: new Date(),
        },
      });

      // 各ユーザーにメールを送信
      const emailResults = [];
      let sentCount = 0;
      let failCount = 0;

      for (const user of users) {
        try {
          const emailTemplate = getAdminNotificationEmailTemplate({
            subject,
            title,
            message,
            userName: user.name || undefined,
            ctaText,
            ctaUrl,
          });

          const result = await sendEmail({
            to: user.email,
            subject: emailTemplate.subject,
            text: emailTemplate.text,
            html: emailTemplate.html,
          });

          sentCount++;
          emailResults.push({
            userId: user.id,
            email: user.email,
            success: true,
            messageId: result.messageId,
          });
        } catch (error) {
          failCount++;
          emailResults.push({
            userId: user.id,
            email: user.email,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // 送信結果をログに更新
      await tx.adminEmailLog.update({
        where: { id: emailLog.id },
        data: {
          sentCount,
          failCount,
        },
      });

      console.log('メール送信完了:', {
        emailLogId: emailLog.id,
        totalCount: users.length,
        sentCount,
        failCount,
      });

      return {
        emailLogId: emailLog.id,
        totalCount: users.length,
        sentCount,
        failCount,
        results: emailResults,
      };
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('管理者メール送信エラー:', error);
    return NextResponse.json(
      {
        error: 'メール送信中にエラーが発生しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
});