// app/api/admin/email/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminUser } from '@/lib/utils/admin-access-server';
import { sendEmail } from '@/lib/email';
import { getAdminNotificationEmailTemplate } from '@/lib/email/templates/admin-notification';
import { processWithIdempotency } from '@/lib/utils/idempotency';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60秒に延長

// メール送信の結果を表す型定義
interface EmailResult {
  success: boolean;
  emailLogId: string;
  totalCount: number;
  sentCount: number;
  failCount: number;
  results: Array<{
    userId: string;
    email: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

export async function POST(request: Request) {
  try {
    // ステップ1: 認証と管理者権限チェック
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 });
    }

    // ステップ2: 冪等性キーの取得
    const idempotencyKey = request.headers.get('X-Idempotency-Key');

    // 冪等性処理（二重送信防止処理）を使用
    return await processWithIdempotency(
      idempotencyKey,
      '/api/admin/email',
      async () => {
        // ステップ3: リクエストボディの取得とバリデーション
        const body = (await request.json()) as {
          subject: string;
          title: string;
          message: string;
          targetGroup: string;
          ctaText?: string;
          ctaUrl?: string;
          userId?: string;
        };
        const { subject, title, message, targetGroup, ctaText, ctaUrl, userId } = body;

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

          case 'single_user':
            // 特定のユーザーIDが指定されている場合
            if (!userId) {
              return NextResponse.json(
                { error: '特定ユーザー送信の場合はユーザーIDが必要です' },
                { status: 400 },
              );
            }

            // ユーザーIDで検索
            const singleUser = await prisma.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                name: true,
                email: true,
              },
            });

            if (!singleUser) {
              return NextResponse.json(
                { error: '指定されたユーザーが見つかりません' },
                { status: 404 },
              );
            }

            users = [singleUser];
            break;

          // 既存のケース...

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

        // ステップ5: メール送信ログの作成
        const emailLog = await prisma.adminEmailLog.create({
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

        // ステップ6: ユーザーを小さなバッチに分割して処理
        const BATCH_SIZE = 5; // バッチサイズを小さくする（レート制限対策）
        const batches = [];
        for (let i = 0; i < users.length; i += BATCH_SIZE) {
          batches.push(users.slice(i, i + BATCH_SIZE));
        }

        let sentCount = 0;
        let failCount = 0;
        const emailResults = [];

        // バッチごとにメール送信
        for (const batch of batches) {
          // 各バッチ内のユーザーを1人ずつ処理（APIレート制限対策）
          for (const user of batch) {
            try {
              const emailTemplate = getAdminNotificationEmailTemplate({
                subject,
                title,
                message,
                userName: user.name || undefined,
                ctaText,
                ctaUrl,
              });

              // メール送信
              const result = await sendEmail({
                to: user.email,
                subject: emailTemplate.subject,
                text: emailTemplate.text,
                html: emailTemplate.html,
              });

              // 成功の記録
              emailResults.push({
                userId: user.id,
                email: user.email,
                success: true,
                messageId: result.messageId,
              });
              sentCount++;
            } catch (error) {
              console.error(`ユーザー ${user.id} へのメール送信エラー:`, error);

              // レート制限エラーの場合、少し長めに待機してから再試行
              if (error instanceof Error && error.message.includes('Too many requests')) {
                console.log(`レート制限エラー: ${user.email} - 5秒待機して再試行します`);
                await new Promise((resolve) => setTimeout(resolve, 5000));

                try {
                  // 再試行
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

                  // 成功の記録
                  emailResults.push({
                    userId: user.id,
                    email: user.email,
                    success: true,
                    messageId: result.messageId,
                  });
                  sentCount++;
                  continue; // 次のユーザーへ
                } catch (retryError) {
                  console.error(`再試行失敗: ${user.email}`, retryError);
                }
              }

              // 失敗の記録
              emailResults.push({
                userId: user.id,
                email: user.email,
                success: false,
                error: error instanceof Error ? error.message : String(error),
              });
              failCount++;
            }

            // 各メール送信間に1秒の待機を入れる（レート制限対策）
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }

          // バッチごとに進捗を更新
          await prisma.adminEmailLog.update({
            where: { id: emailLog.id },
            data: {
              sentCount,
              failCount,
            },
          });

          // バッチ間の待機時間（レート制限対策）
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        // ステップ7: 最終結果を準備
        const result: EmailResult = {
          success: true,
          emailLogId: emailLog.id,
          totalCount: users.length,
          sentCount,
          failCount,
          results: emailResults,
        };

        console.log('メール送信完了:', {
          emailLogId: emailLog.id,
          totalCount: users.length,
          sentCount,
          failCount,
        });

        // 結果を返却
        return NextResponse.json(result);
      },
      60, // 60分間有効
    );
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
}