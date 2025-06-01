// app/api/corporate/users/invite/accept/route.ts (修正版)
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { logCorporateActivity } from '@/lib/utils/activity-logger';
export async function POST(request: Request) {
  try {
    const { token, password, lastName, firstName, lastNameKana, firstNameKana, name } =
      await request.json();
    logger.debug('招待受け入れリクエスト:', {
      token: token ? '存在します' : '存在しません',
      password: password ? 'セットされています' : 'セットされていません',
      lastName,
      firstName,
      lastNameKana,
      firstNameKana,
      name,
    });
    if (!token || !password) {
      return NextResponse.json({ error: 'トークンとパスワードが必要です' }, { status: 400 });
    }
    // トークンを検証
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            tenant: true,
          },
        },
      },
    });
    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json({ error: 'トークンが無効または期限切れです' }, { status: 400 });
    }
    // 🔥 重要な修正: ユーザーが既にどのテナントに所属すべきかを確認
    // まず現在のユーザーのテナント関連情報を取得
    const currentUser = await prisma.user.findUnique({
      where: { id: resetToken.userId },
      include: {
        tenant: true,
        adminOfTenant: true,
      },
    });
    if (!currentUser) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    // 🔥 修正: テナント情報を正しく特定
    let tenantInfo = null;
    // 1. 既にテナントに関連付けられている場合はそれを使用
    if (currentUser.tenant) {
      tenantInfo = currentUser.tenant;
      logger.debug('既存のテナント関連付けを使用:', tenantInfo.id);
    }
    // 2. 管理者権限がある場合（まれなケース）
    else if (currentUser.adminOfTenant) {
      tenantInfo = currentUser.adminOfTenant;
      logger.debug('管理者テナントを使用:', tenantInfo.id);
    }
    // 3. どちらもない場合、招待時に設定されるべきテナントを検索
    else {
      // 招待時に設定されたcorporateRoleから推測してテナントを検索
      // 通常の招待プロセスでは、ユーザー作成時にtenantIdが設定されるべき
      // 最近の招待記録から関連テナントを検索（フォールバック）
      const recentInvite = await prisma.corporateActivityLog.findFirst({
        where: {
          action: 'invite_user',
          entityId: resetToken.userId,
        },
        include: {
          tenant: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      if (recentInvite?.tenant) {
        tenantInfo = recentInvite.tenant;
        logger.debug('招待記録からテナントを特定:', tenantInfo.id);
      } else {
        logger.error('❌ テナント情報を特定できませんでした', {
          userId: resetToken.userId,
          hasCurrentTenant: !!currentUser.tenant,
          hasAdminTenant: !!currentUser.adminOfTenant,
          corporateRole: currentUser.corporateRole,
        });
        return NextResponse.json(
          { error: 'テナント情報を特定できませんでした。管理者にお問い合わせください。' },
          { status: 400 },
        );
      }
    }
    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);
    // 姓名を結合したname値の生成
    const fullName = name || `${lastName || ''} ${firstName || ''}`.trim();
    // 🔥 重要な修正: トランザクションでユーザー情報を確実に更新
    await prisma.$transaction(async (tx) => {
      // ユーザー情報を更新（tenantIdを確実に設定）
      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          // 認証関連
          password: hashedPassword,
          emailVerified: new Date(),
          // 姓名情報
          name: fullName || undefined,
          lastName: lastName || undefined,
          firstName: firstName || undefined,
          lastNameKana: lastNameKana || undefined,
          firstNameKana: firstNameKana || undefined,
          // 🔥 重要: テナント関連付けを確実に設定
          corporateRole: 'member',
          tenantId: tenantInfo.id, // 明示的にtenantIdを設定
        },
      });
      // 使用済みトークンを削除
      await tx.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      // アクティビティログを記録
      await logCorporateActivity({
        tenantId: tenantInfo.id,
        userId: resetToken.userId,
        action: 'accept_invite',
        entityType: 'user',
        entityId: resetToken.userId,
        description: `${fullName}さんが招待を受け入れ、法人テナントに参加しました`,
        metadata: {
          email: currentUser.email,
          previousTenantId: currentUser.tenantId,
          newTenantId: tenantInfo.id,
        },
      });
    });
    logger.debug('✅ 招待受け入れ完了:', {
      userId: resetToken.userId,
      name: fullName,
      tenantId: tenantInfo.id,
      tenantName: tenantInfo.name,
      corporateRole: 'member',
    });
    return NextResponse.json({
      success: true,
      tenantId: tenantInfo.id,
      tenantName: tenantInfo.name,
      hasTenanct: true, // typoを修正: hasTenant
      hasTenant: true,
      message: `${tenantInfo.name}への参加が完了しました`,
    });
  } catch (error) {
    logger.error('❌ 招待受け入れエラー:', error);
    return NextResponse.json(
      {
        error: '招待の受け入れ中にエラーが発生しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}