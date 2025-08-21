// app/api/admin/one-tap-seal/orders/[id]/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ステータス更新スキーマ
const UpdateOrderSchema = z.object({
  status: z.enum(['pending', 'paid', 'preparing', 'shipped', 'delivered']).optional(),
  trackingNumber: z.string().optional(),
  shippedBy: z.string().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 管理者権限チェック
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        isFinancialAdmin: true,
      },
    });

    const isAuthorized =
      user?.isFinancialAdmin ||
      user?.email === 'admin@sns-share.com' ||
      (session.user as any)?.role === 'super-admin' ||
      (session.user as any)?.role === 'financial-admin';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    const body = await request.json();
    const validation = UpdateOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'リクエストデータが無効です', details: validation.error.errors },
        { status: 400 },
      );
    }

    const { status, trackingNumber, shippedBy } = validation.data;
    const orderId = params.id;

    // 注文の存在確認
    const existingOrder = await prisma.oneTapSealOrder.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        items: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: '注文が見つかりません' }, { status: 404 });
    }

    // 更新データを準備
    const updateData: any = {};

    if (status) {
      updateData.status = status;
    }

    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber;
      // 追跡番号が設定された場合は発送日時も更新
      if (trackingNumber) {
        updateData.shippedAt = new Date();
        updateData.shippedBy = shippedBy || session.user.id;
        // ステータスも自動的にshippedに更新
        updateData.status = 'shipped';
      }
    }

    // 注文を更新
    const updatedOrder = await prisma.oneTapSealOrder.update({
      where: { id: orderId },
      data: updateData,
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        items: true,
      },
    });

    // 発送完了メール送信（追跡番号が設定された場合）
    if (trackingNumber && existingOrder.user?.email) {
      try {
        // ここで実際のメール送信処理を実装
        // 例：SendGridやResendなどを使用
        logger.info('ワンタップシール発送完了メール送信', {
          orderId: updatedOrder.id,
          userEmail: existingOrder.user.email,
          trackingNumber,
        });
      } catch (emailError) {
        logger.error('発送完了メール送信エラー:', emailError);
        // メール送信エラーは注文更新の成功に影響させない
      }
    }

    logger.info('ワンタップシール注文更新完了', {
      orderId: updatedOrder.id,
      adminId: session.user.id,
      adminEmail: user?.email,
      updates: updateData,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        trackingNumber: updatedOrder.trackingNumber,
        shippedAt: updatedOrder.shippedAt?.toISOString() || null,
        shippedBy: updatedOrder.shippedBy,
        updatedAt: updatedOrder.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('ワンタップシール注文更新エラー:', error);
    return NextResponse.json({ error: '注文の更新に失敗しました' }, { status: 500 });
  }
}