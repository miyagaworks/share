// app/api/corporate/users/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
export async function GET() {
  try {
    logger.debug('[API] /api/corporate/users リクエスト受信');
    // セッション認証チェック
    const session = await auth();
    if (!session || !session.user?.id) {
      logger.debug('[API] 認証されていないアクセス');
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    const userId = session.user.id;
    logger.debug('[API] ユーザーID:', userId);
    // ユーザー情報を取得（より単純なクエリ）
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionStatus: true, // 永久利用権ユーザー判定用
      },
    });
    if (!user) {
      logger.debug('[API] ユーザーが見つかりません');
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    // 永久利用権ユーザーの場合、仮想テナントユーザー情報を返す
    if (user.subscriptionStatus === 'permanent') {
      logger.debug('[API] 永久利用権ユーザー用仮想ユーザーデータを生成:', userId);
      // 単一ユーザーの仮想データを生成
      const virtualUser = {
        id: userId,
        name: user.name || '永久利用権ユーザー',
        email: user.email,
        corporateRole: 'admin',
        department: { id: 'default-dept', name: '全社' },
        isAdmin: true,
        isSoleAdmin: true,
        isInvited: false,
        invitedAt: null,
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json({
        success: true,
        users: [virtualUser],
        isAdmin: true,
        tenantId: `virtual-tenant-${userId}`,
        adminCount: 1,
      });
    }
    // テナントIDを取得するための追加クエリ
    // adminOfTenantの関係を持つユーザーを検索
    const corporateTenant = await prisma.corporateTenant.findFirst({
      where: { adminId: userId },
    });
    // 管理者権限を持つか確認
    const isAdmin = !!corporateTenant;
    if (!isAdmin) {
      logger.debug('[API] 管理者権限がありません');
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }
    if (!corporateTenant) {
      logger.debug('[API] テナントが見つかりません');
      return NextResponse.json({ error: 'テナント情報が見つかりません' }, { status: 404 });
    }
    // 管理者数をカウント
    const adminCount = await prisma.user.count({
      where: {
        tenantId: corporateTenant.id,
        corporateRole: 'admin',
      },
    });
    // テナントのユーザー一覧を取得
    const users = await prisma.user.findMany({
      where: {
        OR: [{ tenantId: corporateTenant.id }, { id: corporateTenant.adminId }],
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    // ユーザー情報を整形
    const formattedUsers = users.map((user) => {
      const isUserAdmin = user.id === corporateTenant.adminId;
      const isSoleAdmin = user.corporateRole === 'admin' && adminCount === 1;
      // 管理者の場合は特別扱いし、常にアクティブとみなす
      const isInvitedStatus = isUserAdmin ? false : !user.emailVerified;
      return {
        id: user.id,
        name: user.name || '名前未設定',
        email: user.email,
        corporateRole: user.corporateRole || (isUserAdmin ? 'admin' : 'member'),
        department: user.department,
        isAdmin: isUserAdmin,
        isSoleAdmin: isSoleAdmin,
        isInvited: isInvitedStatus, // 管理者は常にfalse（招待中ではない）
        invitedAt: isInvitedStatus ? user.createdAt.toISOString() : null,
        createdAt: user.createdAt.toISOString(),
      };
    });
    return NextResponse.json({
      success: true,
      users: formattedUsers,
      isAdmin: true,
      tenantId: corporateTenant.id,
      adminCount: adminCount, // 管理者の総数
    });
  } catch (error) {
    logger.error('[API] エラー:', error);
    return NextResponse.json(
      {
        error: 'ユーザー情報の取得に失敗しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}