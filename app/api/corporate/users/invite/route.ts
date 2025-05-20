// app/api/corporate/users/invite/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { logUserActivity } from '@/lib/utils/activity-logger';
import { getInviteEmailTemplate } from '@/lib/email/templates/invite-email';

// POSTリクエストでユーザー招待を処理
export async function POST(request: Request) {
  try {
    console.log('[API] /api/corporate/users/invite POSTリクエスト受信');
    console.log('リクエストボディ:', await request.clone().text());

    // セッション認証チェック
    const session = await auth();

    if (!session || !session.user?.id) {
      console.log('[API] 認証されていないアクセス');
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('[API] ユーザーID:', userId);

    // リクエストボディを取得
    const body = await request.json();
    const { emails, role, departmentId } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: '有効なメールアドレスのリストが必要です' },
        { status: 400 },
      );
    }

    // テナント情報を取得
    const corporateTenant = await prisma.corporateTenant.findFirst({
      where: { adminId: userId },
      include: {
        users: true,
      },
    });

    if (!corporateTenant) {
      console.log('[API] テナントが見つかりません');
      return NextResponse.json({ error: 'テナント情報が見つかりません' }, { status: 404 });
    }

    // 最大ユーザー数チェック
    if (corporateTenant.users.length + emails.length > corporateTenant.maxUsers) {
      return NextResponse.json(
        {
          error: 'ユーザー数上限オーバー',
          message: `ユーザー数の上限（${corporateTenant.maxUsers}人）を超えています。`,
        },
        { status: 400 },
      );
    }

    // 部署の存在チェック（指定されている場合）
    let department = null;
    if (departmentId) {
      department = await prisma.department.findUnique({
        where: {
          id: departmentId,
          tenantId: corporateTenant.id, // 同じテナントに所属する部署であることを確認
        },
      });

      if (!department) {
        return NextResponse.json({ error: '指定された部署が見つかりません' }, { status: 400 });
      }
    }

    // 招待処理
    const inviteResults = [];
    const errors = [];

    for (const email of emails) {
      try {
        // 既存ユーザーチェック
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser && existingUser.tenantId === corporateTenant.id) {
          errors.push(`${email}: すでにこのテナントに招待されています`);
          continue;
        }

        // 招待トークン生成
        const token = generateInviteToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 72); // 72時間有効

        // 新しいユーザーを作成または既存ユーザーを更新
        const user = await prisma.user.upsert({
          where: { email },
          update: {
            corporateRole: role || 'member',
            tenantId: corporateTenant.id,
            departmentId: departmentId || null,
          },
          create: {
            email,
            name: email.split('@')[0], // 仮の名前としてメールアドレスの@前を使用
            corporateRole: role || 'member',
            tenantId: corporateTenant.id,
            departmentId: departmentId || null,
          },
        });

        // トークンを別途保存
        await prisma.passwordResetToken.create({
          data: {
            token,
            expires: expiresAt,
            userId: user.id,
          },
        });

        // 招待メール送信部分の修正
        // 環境変数から適切なベースURLを取得
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.NEXT_PUBLIC_BASE_URL ||
          process.env.NEXTAUTH_URL ||
          'https://app.sns-share.com';

        // URLの正規化（末尾のスラッシュを削除）
        const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

        // 招待リンクの生成
        const inviteUrl = `${normalizedBaseUrl}/auth/invite?token=${token}`;

        // メール送信
        const emailTemplate = getInviteEmailTemplate({
          companyName: corporateTenant.name,
          inviteUrl: inviteUrl,
        });

        console.log('招待メールテンプレート生成:', {
          subject: emailTemplate.subject,
          inviteUrl: inviteUrl,
        });

        await sendEmail({
          to: email,
          subject: emailTemplate.subject,
          text: emailTemplate.text,
          html: emailTemplate.html,
        });

        // デバッグログ
        console.log(`招待メール送信: ${email}、トークン: ${token.substring(0, 8)}...`);

        inviteResults.push({ email, success: true, userId: user.id });
      } catch (error) {
        console.error(`招待エラー (${email}):`, error);
        errors.push(`${email}: 招待の処理中にエラーが発生しました`);
      }
    }

    // 成功した招待ごとにアクティビティを記録
    for (const result of inviteResults) {
      await logUserActivity(
        corporateTenant.id,
        userId, // 管理者（招待した人）のID
        result.userId, // 招待されたユーザーID
        'invite_user',
        `ユーザー「${result.email}」を招待しました`,
        {
          email: result.email,
          role: role || 'member',
          departmentId: departmentId || null,
          departmentName: department?.name || null,
        },
      );
    }

    // 成功した招待ごとにアクティビティを記録
    for (const result of inviteResults) {
      // logUserActivityを使う場合（ユーザー関連のアクティビティ）
      await logUserActivity(
        corporateTenant.id,
        userId, // アクションを実行したユーザー（管理者）
        result.userId, // 対象ユーザー
        'invite_user',
        `ユーザー「${result.email}」を招待しました`,
        {
          email: result.email,
          role: role || 'member',
          departmentId: departmentId || null,
          departmentName: department?.name || null,
        },
      );
    }

    return NextResponse.json({
      success: true,
      invitedCount: inviteResults.length,
      inviteResults,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error) {
    console.error('[API] エラー:', error);
    return NextResponse.json(
      {
        error: 'ユーザー招待の処理に失敗しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// ランダムな招待トークンを生成する関数
function generateInviteToken(): string {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
}
