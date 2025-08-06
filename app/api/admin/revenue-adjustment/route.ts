// app/api/admin/revenue-adjustment/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkAdminPermission, isSuperAdmin } from '@/lib/utils/admin-access-server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

// 型定義
interface RevenueAdjustmentRequest {
  year: number;
  month: number;
  adjustmentType: 'self_reduction' | 'admin_proposal' | 'peer_proposal';
  targetPerson: 'yoshitsune' | 'kensei';
  adjustedPercent: number;
  reason: string;
}

interface ApprovalRequest {
  adjustmentId: string;
  action: 'approve' | 'reject';
  comments?: string;
}

// Prismaクエリ結果の型定義
interface PrismaRevenueAdjustment {
  id: string;
  year: number;
  month: number;
  adjustmentType: string;
  targetPerson: string;
  originalPercent: number;
  adjustedPercent: number;
  reason: string;
  proposedBy: string;
  approvedBy: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  proposer: {
    name: string | null;
    email: string;
  } | null;
  approver: {
    name: string | null;
    email: string;
  } | null;
}

// 配分調整申請の作成
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    const body: RevenueAdjustmentRequest = await request.json();
    const { year, month, adjustmentType, targetPerson, adjustedPercent, reason } = body;

    // バリデーション
    if (!year || !month || !adjustmentType || !targetPerson || adjustedPercent === undefined) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }

    if (adjustedPercent < 0 || adjustedPercent > 30) {
      return NextResponse.json(
        { error: '配分率は0%〜30%の範囲で設定してください' },
        { status: 400 },
      );
    }

    // 重複申請のチェック
    const existingAdjustment = await prisma.revenueShareAdjustment.findFirst({
      where: {
        year,
        month,
        targetPerson,
        status: 'pending',
      },
    });

    if (existingAdjustment) {
      return NextResponse.json(
        { error: '同じ対象者・期間で処理中の申請が既に存在します' },
        { status: 400 },
      );
    }

    // 自己減額の場合、対象者本人かチェック
    if (adjustmentType === 'self_reduction') {
      const userRole = await getUserRole(session.user.id);
      if (
        (targetPerson === 'yoshitsune' && userRole !== 'yoshitsune') ||
        (targetPerson === 'kensei' && userRole !== 'kensei')
      ) {
        return NextResponse.json({ error: '自己減額は本人のみ申請できます' }, { status: 403 });
      }
    }

    // 申請作成
    const adjustment = await prisma.revenueShareAdjustment.create({
      data: {
        year,
        month,
        adjustmentType,
        targetPerson,
        originalPercent: 30.0, // 基本配分率
        adjustedPercent,
        reason,
        proposedBy: session.user.id,
        status: adjustmentType === 'self_reduction' ? 'approved' : 'pending', // 自己減額は自動承認
        approvedBy: adjustmentType === 'self_reduction' ? session.user.id : null,
      },
    });

    logger.info('配分調整申請作成:', {
      adjustmentId: adjustment.id,
      year,
      month,
      adjustmentType,
      targetPerson,
      proposedBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      adjustmentId: adjustment.id,
      message:
        adjustmentType === 'self_reduction'
          ? '自己減額申請が承認されました'
          : '配分調整申請を送信しました',
    });
  } catch (error: any) {
    logger.error('配分調整申請エラー:', error);
    return NextResponse.json(
      {
        error: '配分調整申請の処理に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

// 配分調整申請の承認・否認
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // スーパー管理者権限をチェック
    const isSuper = await isSuperAdmin(session.user.id);
    if (!isSuper) {
      return NextResponse.json({ error: 'スーパー管理者権限が必要です' }, { status: 403 });
    }

    const body: ApprovalRequest = await request.json();
    const { adjustmentId, action, comments } = body;

    if (!adjustmentId || !action) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }

    // 申請の存在確認
    const adjustment = await prisma.revenueShareAdjustment.findUnique({
      where: { id: adjustmentId },
      include: {
        proposer: { select: { name: true, email: true } },
      },
    });

    if (!adjustment) {
      return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });
    }

    if (adjustment.status !== 'pending') {
      return NextResponse.json({ error: '処理済みの申請です' }, { status: 400 });
    }

    // 承認・否認の実行
    const updatedAdjustment = await prisma.revenueShareAdjustment.update({
      where: { id: adjustmentId },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        approvedBy: session.user.id,
      },
    });

    logger.info('配分調整申請処理:', {
      adjustmentId,
      action,
      approvedBy: session.user.id,
      targetPerson: adjustment.targetPerson,
    });

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? '申請を承認しました' : '申請を否認しました',
    });
  } catch (error: any) {
    logger.error('配分調整承認エラー:', error);
    return NextResponse.json(
      {
        error: '配分調整の承認処理に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

// 配分調整申請の取得
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

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // フィルター条件を構築
    const where: any = {};
    if (year) where.year = year;
    if (month) where.month = month;
    if (status) where.status = status;

    // 申請を取得
    const adjustments = await prisma.revenueShareAdjustment.findMany({
      where,
      include: {
        proposer: { select: { name: true, email: true } },
        approver: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const totalCount = await prisma.revenueShareAdjustment.count({ where });

    // 型安全なマッピング
    const formattedAdjustments = adjustments.map((adj: PrismaRevenueAdjustment) => ({
      id: adj.id,
      year: adj.year,
      month: adj.month,
      adjustmentType: adj.adjustmentType,
      targetPerson: adj.targetPerson,
      originalPercent: adj.originalPercent,
      adjustedPercent: adj.adjustedPercent,
      reason: adj.reason,
      status: adj.status,
      createdAt: adj.createdAt,
      updatedAt: adj.updatedAt,
      proposer: adj.proposer
        ? {
            name: adj.proposer.name,
            email: adj.proposer.email,
          }
        : null,
      approver: adj.approver
        ? {
            name: adj.approver.name,
            email: adj.approver.email,
          }
        : null,
    }));

    return NextResponse.json({
      adjustments: formattedAdjustments,
      totalCount,
      hasMore: offset + limit < totalCount,
    });
  } catch (error: any) {
    logger.error('配分調整取得エラー:', error);
    return NextResponse.json(
      {
        error: '配分調整申請の取得に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

/**
 * ユーザーの役割を取得する（受託者判定用）
 */
async function getUserRole(userId: string): Promise<'yoshitsune' | 'kensei' | 'other'> {
  // 実際の実装では、Userテーブルの情報やメタデータから判定
  // ここでは簡易的な実装例
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!user) return 'other';

  // メールアドレスや名前で判定（実際の実装に合わせて調整）
  if (user.email?.includes('yoshitsune') || user.name?.includes('義経')) {
    return 'yoshitsune';
  }
  if (user.email?.includes('kensei') || user.name?.includes('健世')) {
    return 'kensei';
  }

  return 'other';
}