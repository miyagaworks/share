// app/api/one-tap-seal/order/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  ONE_TAP_SEAL_COLORS,
  ONE_TAP_SEAL_CONFIG,
  type CreateOneTapSealItem,
} from '@/types/one-tap-seal';
import { calculateOrderAmount, validateOneTapSealOrder } from '@/lib/one-tap-seal/order-calculator';
import { validatePostalCode } from '@/lib/one-tap-seal/qr-slug-manager';

// リクエストスキーマ
const CreateOrderSchema = z.object({
  orderType: z.enum(['individual', 'corporate']),
  items: z.array(
    z.object({
      color: z.enum(ONE_TAP_SEAL_COLORS),
      quantity: z.number().min(1).max(ONE_TAP_SEAL_CONFIG.MAX_QUANTITY_PER_COLOR),
      qrSlug: z.string().min(3).max(20),
      memberUserId: z.string().optional(),
    }),
  ),
  shippingAddress: z.object({
    postalCode: z.string().min(7).max(8),
    address: z.string().min(5).max(200),
    recipientName: z.string().min(1).max(50),
  }),
  subscriptionId: z.string().optional(),
});

type CreateOrderRequest = z.infer<typeof CreateOrderSchema>;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // リクエストボディの解析
    const body = await request.json();

    // バリデーション
    const validation = CreateOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'リクエストデータが無効です', details: validation.error.errors },
        { status: 400 },
      );
    }

    const orderData: CreateOrderRequest = validation.data;

    // ValidationOneTapSealItem型に変換してバリデーション
    const validationItems = orderData.items.map((item) => ({
      ...item,
      unitPrice: ONE_TAP_SEAL_CONFIG.UNIT_PRICE,
    }));

    const itemValidation = validateOneTapSealOrder(validationItems);
    if (!itemValidation.isValid) {
      return NextResponse.json({ error: itemValidation.errors[0] }, { status: 400 });
    }

    // 郵便番号バリデーション
    if (!validatePostalCode(orderData.shippingAddress.postalCode)) {
      return NextResponse.json({ error: '郵便番号の形式が正しくありません' }, { status: 400 });
    }

    // 個人注文の場合の権限チェック
    if (orderData.orderType === 'individual') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          subscriptionStatus: true,
          trialEndsAt: true,
          corporateRole: true,
          tenantId: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
      }

      // アクティブなプランまたはトライアル中かチェック
      const now = new Date();
      const isTrialing = user.trialEndsAt && now < user.trialEndsAt;
      const isActive = user.subscriptionStatus === 'active';
      const isPermanent = user.subscriptionStatus === 'permanent';

      if (!isActive && !isTrialing && !isPermanent) {
        return NextResponse.json(
          { error: 'ワンタップシールを注文するには有効なプランが必要です' },
          { status: 403 },
        );
      }

      // 法人メンバーの場合は管理者権限をチェック
      if (user.tenantId && user.corporateRole !== 'admin') {
        return NextResponse.json({ error: '法人メンバーは個人注文できません' }, { status: 403 });
      }
    }

    // 法人注文の場合の権限チェック
    if (orderData.orderType === 'corporate') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          corporateRole: true,
          tenantId: true,
          adminOfTenant: true,
        },
      });

      if (!user?.adminOfTenant && user?.corporateRole !== 'admin') {
        return NextResponse.json({ error: '法人管理者権限が必要です' }, { status: 403 });
      }
    }

    // 金額計算
    const calculation = calculateOrderAmount(validationItems);

    // データベーストランザクション
    const result = await prisma.$transaction(async (tx) => {
      // 注文作成
      const order = await tx.oneTapSealOrder.create({
        data: {
          userId: session.user.id,
          tenantId:
            orderData.orderType === 'corporate'
              ? (
                  await tx.user.findUnique({
                    where: { id: session.user.id },
                    select: { tenantId: true },
                  })
                )?.tenantId
              : null,
          orderType: orderData.orderType,
          postalCode: orderData.shippingAddress.postalCode,
          address: orderData.shippingAddress.address,
          recipientName: orderData.shippingAddress.recipientName,
          sealTotal: calculation.sealTotal,
          shippingFee: calculation.shippingFee,
          taxAmount: calculation.taxAmount,
          totalAmount: calculation.totalAmount,
          subscriptionId: orderData.subscriptionId,
        },
      });

      // 注文アイテム作成
      for (const item of orderData.items) {
        await tx.oneTapSealItem.create({
          data: {
            orderId: order.id,
            memberUserId: item.memberUserId,
            color: item.color,
            quantity: item.quantity,
            unitPrice: ONE_TAP_SEAL_CONFIG.UNIT_PRICE,
            qrSlug: item.qrSlug,
          },
        });

        // QRコードページが存在しない場合は作成
        const existingQrCode = await tx.qrCodePage.findUnique({
          where: { slug: item.qrSlug },
        });

        if (!existingQrCode) {
          // ユーザー情報を取得してQRコードページ作成に必要な情報を準備
          const user = await tx.user.findUnique({
            where: { id: item.memberUserId || session.user.id },
            select: { name: true, email: true },
          });

          await tx.qrCodePage.create({
            data: {
              slug: item.qrSlug,
              userId: item.memberUserId || session.user.id,
              userName: user?.name || user?.email || item.qrSlug,
              profileUrl: `https://app.sns-share.com/qr/${item.qrSlug}`,
              template: 'default',
              primaryColor: '#3B82F6',
              secondaryColor: '#1E40AF',
            },
          });
        }
      }

      return order;
    });

    logger.info('ワンタップシール注文作成完了', {
      orderId: result.id,
      userId: session.user.id,
      orderType: orderData.orderType,
      itemCount: calculation.itemCount,
      totalAmount: calculation.totalAmount,
    });

    return NextResponse.json({
      success: true,
      orderId: result.id,
      totalAmount: calculation.totalAmount,
    });
  } catch (error) {
    logger.error('ワンタップシール注文作成エラー:', error);
    return NextResponse.json({ error: '注文の作成に失敗しました' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 最新の注文を取得
    const order = await prisma.oneTapSealOrder.findFirst({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            memberUser: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!order) {
      return NextResponse.json({ order: null });
    }

    return NextResponse.json({
      order: {
        ...order,
        items: order.items.map((item: any) => ({
          ...item,
          memberName: item.memberUser?.name,
        })),
      },
    });
  } catch (error) {
    logger.error('注文取得エラー:', error);
    return NextResponse.json({ error: '注文情報の取得に失敗しました' }, { status: 500 });
  }
}