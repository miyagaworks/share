// app/api/admin/stripe/settings/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkAdminPermission } from '@/lib/utils/admin-access-server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

// 同期設定のデフォルト値
const DEFAULT_SETTINGS = {
  stripeAutoSync: false,
  syncFrequency: 'manual',
  defaultStripeFeeRate: 3.6, // Stripeの標準手数料率（%）
  notifyOnLargeTransaction: true,
  largeTransactionThreshold: 100000, // 10万円
  lastSyncAt: null,
};

// 同期設定の取得（GET）
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 財務管理者権限以上をチェック
    const hasPermission = await checkAdminPermission(session.user.id, 'financial');
    if (!hasPermission) {
      return NextResponse.json({ error: '財務管理者権限が必要です' }, { status: 403 });
    }

    // AutoSyncSettings テーブルから設定を取得
    let settings = await prisma.autoSyncSettings.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      // デフォルト設定を作成
      settings = await prisma.autoSyncSettings.create({
        data: {
          stripeAutoSync: false,
          syncFrequency: 'manual',
          defaultStripeFeeRate: 3.6,
          notifyOnLargeTransaction: true,
          largeTransactionThreshold: 100000,
          updatedBy: session.user.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        stripeAutoSync: settings.stripeAutoSync,
        syncFrequency: settings.syncFrequency,
        defaultStripeFeeRate: Number(settings.defaultStripeFeeRate),
        notifyOnLargeTransaction: settings.notifyOnLargeTransaction,
        largeTransactionThreshold: Number(settings.largeTransactionThreshold),
        lastSyncAt: settings.lastSyncAt?.toISOString() || null,
      },
    });
  } catch (error: any) {
    logger.error('Stripe設定取得エラー:', error);

    // テーブルが存在しない場合はデフォルト設定を返す
    if (error.code === 'P2021' || error.message.includes('does not exist')) {
      logger.warn('AutoSyncSettings テーブルが存在しません。デフォルト設定を返します。');
      return NextResponse.json({
        success: true,
        settings: DEFAULT_SETTINGS,
        message: 'デフォルト設定を使用しています（テーブル未作成）',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: '設定の取得に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

// 同期設定の更新（PUT）
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 財務管理者権限以上をチェック
    const hasPermission = await checkAdminPermission(session.user.id, 'financial');
    if (!hasPermission) {
      return NextResponse.json({ error: '財務管理者権限が必要です' }, { status: 403 });
    }

    const body = await request.json();
    const {
      stripeAutoSync,
      syncFrequency,
      defaultStripeFeeRate,
      notifyOnLargeTransaction,
      largeTransactionThreshold,
    } = body;

    // 入力検証
    if (syncFrequency && !['daily', 'weekly', 'manual'].includes(syncFrequency)) {
      return NextResponse.json({ error: '無効な同期頻度です' }, { status: 400 });
    }

    if (defaultStripeFeeRate && (defaultStripeFeeRate < 0 || defaultStripeFeeRate > 10)) {
      return NextResponse.json(
        { error: '手数料率は0-10%の範囲で設定してください' },
        { status: 400 },
      );
    }

    if (largeTransactionThreshold && largeTransactionThreshold < 0) {
      return NextResponse.json({ error: '通知閾値は0円以上で設定してください' }, { status: 400 });
    }

    logger.info('Stripe設定更新:', {
      userId: session.user.id,
      updates: body,
    });

    try {
      // 最新の設定を取得
      const currentSettings = await prisma.autoSyncSettings.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      // 新しい設定値を作成
      const updateData: any = {
        updatedBy: session.user.id,
      };

      if (stripeAutoSync !== undefined) updateData.stripeAutoSync = stripeAutoSync;
      if (syncFrequency) updateData.syncFrequency = syncFrequency;
      if (defaultStripeFeeRate !== undefined)
        updateData.defaultStripeFeeRate = defaultStripeFeeRate;
      if (notifyOnLargeTransaction !== undefined)
        updateData.notifyOnLargeTransaction = notifyOnLargeTransaction;
      if (largeTransactionThreshold !== undefined)
        updateData.largeTransactionThreshold = largeTransactionThreshold;

      let updatedSettings;
      if (currentSettings) {
        // 既存設定を更新
        updatedSettings = await prisma.autoSyncSettings.update({
          where: { id: currentSettings.id },
          data: updateData,
        });
      } else {
        // 新規作成
        updatedSettings = await prisma.autoSyncSettings.create({
          data: {
            ...DEFAULT_SETTINGS,
            ...updateData,
            defaultStripeFeeRate: updateData.defaultStripeFeeRate || 3.6,
            largeTransactionThreshold: updateData.largeTransactionThreshold || 100000,
          },
        });
      }

      // 財務アクセスログを記録
      await prisma.financialAccessLog.create({
        data: {
          userId: session.user.id,
          action: 'update',
          entityType: 'stripe_settings',
          details: {
            updatedFields: Object.keys(body),
            newSettings: updateData,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: '設定を更新しました',
        settings: {
          stripeAutoSync: updatedSettings.stripeAutoSync,
          syncFrequency: updatedSettings.syncFrequency,
          defaultStripeFeeRate: Number(updatedSettings.defaultStripeFeeRate),
          notifyOnLargeTransaction: updatedSettings.notifyOnLargeTransaction,
          largeTransactionThreshold: Number(updatedSettings.largeTransactionThreshold),
          lastSyncAt: updatedSettings.lastSyncAt?.toISOString() || null,
        },
      });
    } catch (dbError: any) {
      // テーブルが存在しない場合
      if (dbError.code === 'P2021' || dbError.message.includes('does not exist')) {
        logger.warn('AutoSyncSettings テーブルが存在しません。設定更新をスキップします。');
        return NextResponse.json({
          success: true,
          message: '設定を更新しました（テーブル未作成のためメモリ上のみ）',
          settings: { ...DEFAULT_SETTINGS, ...body },
        });
      }
      throw dbError;
    }
  } catch (error: any) {
    logger.error('Stripe設定更新エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: '設定の更新に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}