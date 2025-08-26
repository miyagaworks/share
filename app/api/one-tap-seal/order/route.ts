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
import { validatePostalCode } from '@/lib/one-tap-seal/profile-slug-manager'; // qr-slug-manager → profile-slug-manager に変更

// リクエストスキーマ
const CreateOrderSchema = z.object({
  orderType: z.enum(['individual', 'corporate']),
  items: z.array(
    z.object({
      color: z.enum(ONE_TAP_SEAL_COLORS),
      quantity: z.number().min(1).max(ONE_TAP_SEAL_CONFIG.MAX_QUANTITY_PER_COLOR),
      profileSlug: z.string().min(3).max(20), // qrSlug → profileSlug に変更
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
        { error: 'リクエストが無効です', details: validation.error.errors },
        { status: 400 },
      );
    }

    const orderData = validation.data;

    // 注文アイテムの検証用にunitPriceを追加
    const validationItems = orderData.items.map((item) => ({
      ...item,
      unitPrice: ONE_TAP_SEAL_CONFIG.UNIT_PRICE,
    }));

    // 注文内容の検証
    const itemValidation = validateOneTapSealOrder(validationItems);
    if (!itemValidation.isValid) {
      return NextResponse.json(
        { error: '注文内容が無効です', details: itemValidation.errors },
        { status: 400 },
      );
    }

    // 金額計算
    const calculation = calculateOrderAmount(validationItems);

    // Profile.slug の存在確認
    for (const item of orderData.items) {
      const existingProfile = await prisma.profile.findUnique({
        where: { slug: item.profileSlug },
      });

      if (!existingProfile) {
        return NextResponse.json(
          { error: `プロフィールスラッグ ${item.profileSlug} が見つかりません` },
          { status: 400 },
        );
      }
    }

    // データベーストランザクション
    const result = await prisma.$transaction(async (tx) => {
      // 注文作成
      const order = await tx.oneTapSealOrder.create({
        data: {
          userId: session.user.id,
          orderType: orderData.orderType,
          status: 'pending',
          sealTotal: calculation.sealTotal,
          shippingFee: calculation.shippingFee,
          taxAmount: calculation.taxAmount,
          totalAmount: calculation.totalAmount,
          shippingAddress: orderData.shippingAddress,
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
            profileSlug: item.profileSlug, // profileSlug を保存
          },
        });
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