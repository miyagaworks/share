// app/api/admin/financial-admins/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import {
  isSuperAdmin,
  getFinancialAdmins,
  addFinancialAdmin,
  removeFinancialAdmin,
} from '@/lib/utils/admin-access-server';
import { prisma } from '@/lib/prisma';

// 財務管理者一覧取得（スーパー管理者のみ）
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    const userId = session.user.id;

    // スーパー管理者チェック
    const isSuper = await isSuperAdmin(userId);
    if (!isSuper) {
      logger.warn('財務管理者一覧取得の権限なし:', { userId });
      return NextResponse.json({ error: 'スーパー管理者権限が必要です' }, { status: 403 });
    }

    // 財務管理者一覧取得
    const financialAdmins = await getFinancialAdmins(userId);

    logger.info('財務管理者一覧取得成功:', {
      executorId: userId,
      count: financialAdmins.length,
    });

    return NextResponse.json({
      success: true,
      data: financialAdmins,
    });
  } catch (error) {
    logger.error('財務管理者一覧取得エラー:', error);
    return NextResponse.json(
      {
        error: '財務管理者一覧の取得に失敗しました',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 },
    );
  }
}

// 財務管理者追加（スーパー管理者のみ）
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    const executorUserId = session.user.id;

    // スーパー管理者チェック
    const isSuper = await isSuperAdmin(executorUserId);
    if (!isSuper) {
      logger.warn('財務管理者追加の権限なし:', { executorUserId });
      return NextResponse.json({ error: 'スーパー管理者権限が必要です' }, { status: 403 });
    }

    // リクエストボディの検証
    const body = await request.json();
    const { userId, notes } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
    }

    if (typeof userId !== 'string') {
      return NextResponse.json({ error: '無効なユーザーIDです' }, { status: 400 });
    }

    // 財務管理者を追加
    const result = await addFinancialAdmin(executorUserId, userId, notes);

    if (result.success) {
      logger.info('財務管理者追加成功:', {
        executorUserId,
        targetUserId: userId,
        notes,
      });

      return NextResponse.json({
        success: true,
        message: result.message,
      });
    } else {
      logger.warn('財務管理者追加失敗:', {
        executorUserId,
        targetUserId: userId,
        reason: result.message,
      });

      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    logger.error('財務管理者追加エラー:', error);
    return NextResponse.json(
      {
        error: '財務管理者の追加に失敗しました',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 },
    );
  }
}

// 財務管理者削除（スーパー管理者のみ）
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    const executorUserId = session.user.id;

    // スーパー管理者チェック
    const isSuper = await isSuperAdmin(executorUserId);
    if (!isSuper) {
      logger.warn('財務管理者削除の権限なし:', { executorUserId });
      return NextResponse.json({ error: 'スーパー管理者権限が必要です' }, { status: 403 });
    }

    // リクエストボディの検証
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
    }

    if (typeof userId !== 'string') {
      return NextResponse.json({ error: '無効なユーザーIDです' }, { status: 400 });
    }

    // 財務管理者を削除
    const result = await removeFinancialAdmin(executorUserId, userId);

    if (result.success) {
      logger.info('財務管理者削除成功:', {
        executorUserId,
        targetUserId: userId,
      });

      return NextResponse.json({
        success: true,
        message: result.message,
      });
    } else {
      logger.warn('財務管理者削除失敗:', {
        executorUserId,
        targetUserId: userId,
        reason: result.message,
      });

      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    logger.error('財務管理者削除エラー:', error);
    return NextResponse.json(
      {
        error: '財務管理者の削除に失敗しました',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 },
    );
  }
}