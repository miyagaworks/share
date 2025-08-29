// app/api/admin/one-tap-seal/orders/[id]/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import {
  ONE_TAP_SEAL_STATUS,
  type OneTapSealStatus,
  type OneTapSealColor,
} from '@/types/one-tap-seal';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// 注文詳細取得API
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // Next.js 15対応: paramsを await する
    const { id } = await params;

    // 管理者権限チェック
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isFinancialAdmin: true,
        email: true,
      },
    });

    // スーパー管理者または財務管理者のチェック
    const isAdmin =
      user &&
      (user.email.toLowerCase() === 'admin@sns-share.com' || user.isFinancialAdmin === true);

    if (!isAdmin) {
      logger.warn('管理者以外の注文詳細アクセス試行', {
        userId: session.user.id,
        orderId: id,
        email: user?.email,
      });
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    // 注文詳細データを取得
    const order = await prisma.oneTapSealOrder.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        tenant: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            memberUser: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: '注文が見つかりません' }, { status: 404 });
    }

    // URL情報を構築
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const enhancedItems = order.items.map((item) => ({
      id: item.id,
      color: item.color as OneTapSealColor,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      profileSlug: item.profileSlug,
      fullUrl: `${baseUrl}/qr/${item.qrSlug || item.profileSlug}`,
      qrPreviewUrl: `${baseUrl}/api/qr-image?slug=${item.qrSlug || item.profileSlug}`,
      profile: item.profileSlug
        ? {
            slug: item.profileSlug,
            userId: item.memberUserId || order.userId,
            userName: item.memberUser?.name || order.user.name,
            userEmail: item.memberUser?.email || order.user.email,
          }
        : undefined,
      memberUser: item.memberUser
        ? {
            id: item.memberUser.id,
            name: item.memberUser.name,
            email: item.memberUser.email,
          }
        : undefined,
    }));

    // レスポンス用の注文データを構築
    const enhancedOrder = {
      id: order.id,
      orderDate: order.createdAt.toISOString(),
      status: order.status as OneTapSealStatus,
      orderType: order.orderType as 'individual' | 'corporate',
      customer: {
        id: order.userId,
        name: order.user.name,
        email: order.user.email,
        tenantName: order.tenant?.name,
      },
      items: enhancedItems,
      sealTotal: order.sealTotal,
      shippingFee: order.shippingFee,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress as {
        postalCode: string;
        address: string;
        building?: string;
        recipientName: string;
      },
      trackingNumber: order.trackingNumber,
      shippedAt: order.shippedAt?.toISOString(),
      shippedBy: order.shippedBy,
    };

    logger.info('注文詳細取得成功', {
      orderId: id,
      adminId: session.user.id,
      status: order.status,
    });

    return NextResponse.json({
      success: true,
      order: enhancedOrder,
    });
  } catch (error) {
    logger.error('注文詳細取得エラー:', error);
    return NextResponse.json({ error: '注文詳細の取得に失敗しました' }, { status: 500 });
  }
}

// 注文ステータス更新API
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // Next.js 15対応: paramsを await する
    const { id } = await params;

    // 管理者権限チェック
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isFinancialAdmin: true,
        email: true,
      },
    });

    const isAdmin =
      user &&
      (user.email.toLowerCase() === 'admin@sns-share.com' || user.isFinancialAdmin === true);

    if (!isAdmin) {
      logger.warn('管理者以外の注文更新試行', {
        userId: session.user.id,
        orderId: id,
        email: user?.email,
      });
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    // リクエストボディを取得
    const body = await request.json();
    const { status, trackingNumber } = body;

    // 更新データを構築
    const updateData: any = {};

    if (status) {
      // ステータスの妥当性チェック
      if (!Object.values(ONE_TAP_SEAL_STATUS).includes(status)) {
        return NextResponse.json({ error: '無効なステータスです' }, { status: 400 });
      }
      updateData.status = status;
    }

    // 追跡番号が設定された場合、発送情報を更新
    if (trackingNumber) {
      updateData.shippedAt = new Date();
      updateData.shippedBy = session.user.id;
      updateData.status = 'shipped'; // 追跡番号設定時は自動的に発送済みステータス
      updateData.trackingNumber = trackingNumber;
    }

    // 注文を更新
    const updatedOrder = await prisma.oneTapSealOrder.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { email: true, name: true },
        },
        items: {
          select: {
            color: true,
            quantity: true,
            profileSlug: true,
          },
        },
      },
    });

    // 発送完了メール送信機能
    if (updateData.status === 'shipped' && trackingNumber) {
      try {
        // メール送信のために完全な注文データを取得
        const orderForMail = await prisma.oneTapSealOrder.findUnique({
          where: { id },
          include: {
            user: {
              select: { email: true, name: true },
            },
            items: {
              select: {
                color: true,
                quantity: true,
                profileSlug: true,
              },
            },
          },
        });

        if (!orderForMail) {
          throw new Error('注文データが見つかりません');
        }

        // 発送完了メール送信
        const { getShippingNotificationTemplate } = await import(
          '@/lib/email/templates/shipping-notification'
        );
        const { sendEmail } = await import('@/lib/email');

        // メールテンプレートを生成
        const template = getShippingNotificationTemplate({
          customerName: orderForMail.user.name || '顧客様',
          customerEmail: orderForMail.user.email,
          orderId: orderForMail.id,
          trackingNumber,
          items: orderForMail.items.map((item) => ({
            color: item.color as any,
            quantity: item.quantity,
            profileSlug: item.profileSlug,
          })),
          shippingAddress: {
            postalCode: (orderForMail.shippingAddress as any).postalCode,
            address: (orderForMail.shippingAddress as any).address,
            building: (orderForMail.shippingAddress as any).building || undefined,
            recipientName: (orderForMail.shippingAddress as any).recipientName,
          },
          orderDate: new Date(orderForMail.createdAt).toLocaleDateString('ja-JP'),
          totalAmount: orderForMail.totalAmount,
        });

        // メール送信
        await sendEmail({
          to: orderForMail.user.email,
          subject: template.subject,
          text: template.text,
          html: template.html,
        });

        logger.info('発送完了メール送信成功', {
          orderId: id,
          customerEmail: orderForMail.user.email,
          trackingNumber,
        });
      } catch (emailError) {
        logger.error('発送完了メール送信エラー', {
          error: emailError instanceof Error ? emailError.message : String(emailError),
          orderId: id,
          trackingNumber,
        });
        // メールエラーは警告として扱い、ステータス更新は成功とする
      }
    }

    logger.info('注文ステータス更新成功', {
      orderId: id,
      adminId: session.user.id,
      oldStatus: 'unknown',
      newStatus: updateData.status,
      trackingNumber: updateData.trackingNumber,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        trackingNumber: updatedOrder.trackingNumber,
        shippedAt: updatedOrder.shippedAt?.toISOString(),
      },
    });
  } catch (error) {
    logger.error('注文更新エラー:', error);
    return NextResponse.json({ error: '注文の更新に失敗しました' }, { status: 500 });
  }
}