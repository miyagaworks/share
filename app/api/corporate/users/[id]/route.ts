// app/api/corporate/users/[id]/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { logUserActivity } from '@/lib/utils/activity-logger';
import { checkPermanentAccess } from '@/lib/corporateAccess';
import { getInviteEmailTemplate } from '@/lib/email/templates/invite-email';

// ユーザー情報を更新するAPI（役割と部署の変更）
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const targetUserId = resolvedParams.id;

    logger.debug(`[API] /api/corporate/users/${targetUserId} PATCHリクエスト受信`);

    // 永久利用権ユーザーかどうかチェック
    const isPermanent = checkPermanentAccess();
    if (isPermanent) {
      // リクエストボディを取得
      const body = await request.json();
      const { role, departmentId } = body;

      return NextResponse.json({
        success: true,
        message: '永久利用権ユーザーの設定は更新されません',
        user: {
          id: targetUserId,
          name: '永久利用権ユーザー',
          email: 'user@example.com',
          corporateRole: role || 'admin',
          departmentId: departmentId || null,
        },
      });
    }

    // セッション認証チェック
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const userId = session.user.id;
    logger.debug(`[API] リクエスト送信ユーザーID: ${userId}`);

    // テナント情報を取得
    const corporateTenant = await prisma.corporateTenant.findFirst({
      where: { adminId: userId },
    });

    if (!corporateTenant) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    // リクエストボディを取得
    const body = await request.json();
    const { role, departmentId } = body;

    logger.debug(`[API] 更新対象ID: ${targetUserId}, 新しい役割: ${role}, 部署ID: ${departmentId}`);

    // 対象ユーザーの現在の情報を取得
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser || targetUser.tenantId !== corporateTenant.id) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    logger.debug(`[API] 対象ユーザー情報:`, targetUser);
    logger.debug(`[API] 対象ユーザーの現在の役割: ${targetUser.corporateRole}`);

    // 管理者の役割を変更する場合のチェック
    if (targetUser.corporateRole === 'admin' && role !== 'admin') {
      logger.debug('[API] 管理者から他の役割への変更を検証します');

      // 他の管理者をカウント
      const otherAdminCount = await prisma.user.count({
        where: {
          tenantId: corporateTenant.id,
          corporateRole: 'admin',
          id: { not: targetUserId },
        },
      });

      logger.debug(`[API] 他の管理者数: ${otherAdminCount}`);

      // 他の管理者がいない場合、エラー
      if (otherAdminCount === 0) {
        logger.debug('[API] エラー: 他の管理者がいないため役割変更できません');
        return NextResponse.json(
          {
            error: '少なくとも1人の管理者が必要です。他のユーザーを先に管理者に設定してください',
          },
          { status: 400 },
        );
      }

      logger.debug('[API] 他の管理者が存在するため、役割変更を許可します');
    }

    // 部署IDが指定されている場合、存在チェック
    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: {
          id: departmentId,
          tenantId: corporateTenant.id,
        },
      });

      if (!department) {
        return NextResponse.json({ error: '指定された部署が見つかりません' }, { status: 400 });
      }
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        corporateRole: role,
        departmentId: departmentId || null,
      },
    });

    logger.debug(
      `[API] ユーザー情報を更新しました: ${updatedUser.id}, 役割: ${updatedUser.corporateRole}`,
    );

    await logUserActivity(
      corporateTenant.id,
      userId,
      targetUserId,
      'update_user',
      `ユーザー「${targetUser.name || targetUser.email}」の情報を更新しました`,
      {
        previousRole: targetUser.corporateRole || null,
        newRole: role || null,
        previousDepartmentId: targetUser.departmentId || null,
        newDepartmentId: departmentId || null,
      },
    );

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        corporateRole: updatedUser.corporateRole,
        departmentId: updatedUser.departmentId,
      },
    });
  } catch (error) {
    logger.error(`[API] ユーザー更新エラー:`, error);
    return NextResponse.json(
      {
        error: 'ユーザー情報の更新に失敗しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// ユーザーを削除するAPI
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const targetUserId = resolvedParams.id;

    logger.debug(`[API] /api/corporate/users/${targetUserId} DELETEリクエスト受信`);

    // 永久利用権ユーザーかどうかチェック
    const isPermanent = checkPermanentAccess();
    if (isPermanent) {
      return NextResponse.json({
        success: true,
        message: '永久利用権ユーザーの設定では操作できません',
      });
    }

    // セッション認証チェック
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const userId = session.user.id;

    // テナント情報を取得
    const corporateTenant = await prisma.corporateTenant.findFirst({
      where: { adminId: userId },
    });

    if (!corporateTenant) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    // 削除対象のユーザーが同じテナントに所属しているか確認
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser || targetUser.tenantId !== corporateTenant.id) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 対象ユーザーが管理者である場合、他の管理者が存在するか確認
    if (targetUser.corporateRole === 'admin') {
      // 他の管理者をカウント
      const otherAdminCount = await prisma.user.count({
        where: {
          tenantId: corporateTenant.id,
          corporateRole: 'admin',
          id: { not: targetUserId },
        },
      });

      // 他の管理者がいない場合、エラー
      if (otherAdminCount === 0) {
        return NextResponse.json(
          {
            error: '少なくとも1人の管理者が必要です。他のユーザーを先に管理者に設定してください',
          },
          { status: 400 },
        );
      }
    }

    // ユーザーを削除
    // 関連する認証情報も削除するため、PasswordResetTokenやAccountも削除
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: { userId: targetUserId },
      }),
      prisma.account.deleteMany({
        where: { userId: targetUserId },
      }),
      prisma.user.delete({
        where: { id: targetUserId },
      }),
    ]);

    // ユーザー削除後のアクティビティログ
    await logUserActivity(
      corporateTenant.id,
      userId,
      targetUserId,
      'delete_user',
      `ユーザー「${targetUser.name || targetUser.email}」を削除しました`,
      {
        email: targetUser.email,
        role: targetUser.corporateRole || null,
        departmentId: targetUser.departmentId || null,
      },
    );

    return NextResponse.json({
      success: true,
      message: 'ユーザーを削除しました',
    });
  } catch (error) {
    logger.error(`[API] ユーザー削除エラー:`, error);
    return NextResponse.json(
      {
        error: 'ユーザーの削除に失敗しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// 招待メールを再送信するAPI
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const targetUserId = resolvedParams.id;

    logger.debug(`[API] /api/corporate/users/${targetUserId}/resend-invite POSTリクエスト受信`);

    // 永久利用権ユーザーかどうかチェック
    const isPermanent = checkPermanentAccess();
    if (isPermanent) {
      return NextResponse.json({
        success: true,
        message: '永久利用権ユーザーの設定では操作できません',
      });
    }

    // セッション認証チェック
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const userId = session.user.id;

    // テナント情報を取得
    const corporateTenant = await prisma.corporateTenant.findFirst({
      where: { adminId: userId },
    });

    if (!corporateTenant) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    // 対象ユーザーの情報を取得
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser || targetUser.tenantId !== corporateTenant.id) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 古いトークンを削除
    await prisma.passwordResetToken.deleteMany({
      where: { userId: targetUserId },
    });

    // 新しいトークンを生成
    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // 72時間有効

    // 新しいトークンを作成
    await prisma.passwordResetToken.create({
      data: {
        token,
        expires: expiresAt,
        userId: targetUserId,
      },
    });

    // 環境変数からベースURLを取得
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      'https://app.sns-share.com';

    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    // 招待リンクの生成
    const inviteUrl = `${normalizedBaseUrl}/auth/invite?token=${token}`;

    // メール送信
    const emailTemplate = getInviteEmailTemplate({
      companyName: corporateTenant.name,
      inviteUrl: inviteUrl,
    });

    await sendEmail({
      to: targetUser.email,
      subject: emailTemplate.subject + '（再送信）',
      text: emailTemplate.text,
      html: emailTemplate.html,
    });

    // ユーザー情報を更新
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        emailVerified: null, // 未確認状態に設定
      },
    });

    return NextResponse.json({
      success: true,
      message: '招待を再送信しました',
    });
  } catch (error) {
    logger.error(`[API] 招待再送信エラー:`, error);
    return NextResponse.json(
      {
        error: '招待の再送信に失敗しました',
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