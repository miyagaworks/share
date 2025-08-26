// app/api/subscription/create/route.ts (正しい修正版 - トライアル期間中も有料プラン加入可能)
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  stripe,
  isStripeAvailable,
  getPaymentLinkByPlan,
  getOneTapSealPriceIds,
  PLAN_CONFIGS,
} from '@/lib/stripe';
import { checkPermanentAccess } from '@/lib/corporateAccess';
import { logger } from '@/lib/utils/logger';
import { ONE_TAP_SEAL_CONFIG, type CreateOneTapSealItem } from '@/types/one-tap-seal';
import { calculateOrderAmount, validateOneTapSealOrder } from '@/lib/one-tap-seal/order-calculator';
import { validatePostalCode } from '@/lib/one-tap-seal/qr-slug-manager';

// プランに基づいて適切な期間終了日を計算する関数
function calculatePeriodEndDate(plan: string, interval: string, startDate: Date): Date {
  logger.debug('計算開始日', { startDate: startDate.toISOString(), interval });
  const endDate = new Date(startDate);
  if (interval === 'year') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }
  logger.debug('計算終了日', { endDate: endDate.toISOString() });
  return endDate;
}

export async function POST(req: NextRequest) {
  try {
    logger.info('プラン作成リクエスト受信', { serverTime: new Date().toISOString() });
    const session = await auth();
    if (!session?.user?.id) {
      logger.warn('認証エラー: ユーザーIDが見つかりません');
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 永久利用権チェック
    const isPermanent = checkPermanentAccess();
    if (isPermanent) {
      return NextResponse.json(
        {
          error: '永久利用権ユーザーはプランを変更できません',
          code: 'permanent_user_restriction',
        },
        { status: 403 },
      );
    }

    if (!isStripeAvailable() || !stripe) {
      logger.error('Stripe APIが利用できません');
      return NextResponse.json(
        { error: '決済システムが正しく構成されていません。管理者にお問い合わせください。' },
        { status: 500 },
      );
    }

    const body = await req.json();
    logger.debug('リクエストボディ', body);

    const {
      plan,
      interval = 'month',
      isCorporate = false,
      oneTapSeal, // ワンタップシール情報
    } = body;

    // 必須パラメータの検証
    if (!plan) {
      logger.warn('パラメータエラー', { plan });
      return NextResponse.json({ error: 'プランが指定されていません' }, { status: 400 });
    }

    // 🆕 ワンタップシール単独決済の場合
    if (plan === 'one_tap_seal_only') {
      return await handleOneTapSealOnlyCheckout(req, session, oneTapSeal);
    }

    // 🔧 ワンタップシール注文の検証
    let oneTapSealAmount = 0;
    let validatedOneTapSealItems = [];

    if (oneTapSeal && oneTapSeal.items && oneTapSeal.items.length > 0) {
      logger.info('ワンタップシール同時注文を検証中');

      // 配送先情報の検証
      if (
        !oneTapSeal.shippingAddress ||
        !oneTapSeal.shippingAddress.postalCode ||
        !oneTapSeal.shippingAddress.address ||
        !oneTapSeal.shippingAddress.recipientName
      ) {
        return NextResponse.json(
          { error: 'ワンタップシールの配送先情報が不完全です' },
          { status: 400 },
        );
      }

      // 郵便番号の検証
      if (!validatePostalCode(oneTapSeal.shippingAddress.postalCode)) {
        return NextResponse.json({ error: '郵便番号の形式が正しくありません' }, { status: 400 });
      }

      // 注文アイテムの検証
      validatedOneTapSealItems = oneTapSeal.items.map((item: CreateOneTapSealItem) => ({
        ...item,
        unitPrice: ONE_TAP_SEAL_CONFIG.UNIT_PRICE,
      }));

      const validation = validateOneTapSealOrder(validatedOneTapSealItems);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: `ワンタップシール注文エラー: ${validation.errors[0]}` },
          { status: 400 },
        );
      }

      // 金額計算
      const calculation = calculateOrderAmount(validatedOneTapSealItems);
      oneTapSealAmount = calculation.totalAmount;

      logger.info('ワンタップシール注文検証完了', {
        itemCount: calculation.itemCount,
        amount: oneTapSealAmount,
      });
    }

    logger.debug('ユーザー情報取得開始', { userId: session.user.id });
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        stripeCustomerId: true,
        trialEndsAt: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      logger.warn('ユーザーが見つかりません', { userId: session.user.id });
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    if (user.subscriptionStatus === 'permanent') {
      return NextResponse.json(
        {
          error: '永久利用権ユーザーはプランを変更できません',
          code: 'permanent_user_restriction',
        },
        { status: 403 },
      );
    }

    // 🔧 プラン情報取得（修正版）
    const planInfo = getPaymentLinkByPlan(plan, interval);

    // 🔧 デバッグログ追加
    logger.info('プラン情報デバッグ', {
      requestedPlan: plan,
      requestedInterval: interval,
      resolvedPlanInfo: planInfo,
      availableKeys: Object.keys(PLAN_CONFIGS),
    });

    if (!planInfo) {
      logger.error('プラン情報が見つかりません', {
        plan,
        interval,
        availableKeys: Object.keys(PLAN_CONFIGS),
      });
      return NextResponse.json({ error: '指定されたプランが見つかりません' }, { status: 400 });
    }

    const basePlanAmount = planInfo.amount;
    const totalAmount = basePlanAmount + oneTapSealAmount;

    logger.info('決済金額計算', {
      plan,
      interval,
      basePlanAmount,
      oneTapSealAmount,
      totalAmount,
      priceId: planInfo.priceId,
    });

    // Stripeカスタマーの取得または作成
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name || undefined,
          metadata: {
            userId: session.user.id,
          },
        });

        customerId = customer.id;

        await prisma.user.update({
          where: { id: session.user.id },
          data: { stripeCustomerId: customerId },
        });

        logger.info('Stripeカスタマー作成完了', { customerId });
      } catch (stripeError) {
        logger.error('Stripe customer creation failed:', stripeError);
        return NextResponse.json({ error: 'カスタマー情報の作成に失敗しました' }, { status: 500 });
      }
    }

    // 🔧 一回限り決済として処理（ワンタップシール+プラン）
    try {
      const lineItems = [];

      // 🔧 プラン料金を一回限りアイテムとして追加
      lineItems.push({
        price_data: {
          currency: 'jpy',
          product_data: {
            name: planInfo.displayName,
            description: `${interval === 'year' ? '年額' : '月額'}プラン`,
          },
          unit_amount: basePlanAmount,
        },
        quantity: 1,
      });

      // ワンタップシール商品を追加
      if (oneTapSeal && oneTapSeal.items && oneTapSeal.items.length > 0) {
        // ワンタップシール（数量分）
        const totalSealQuantity = oneTapSeal.items.reduce(
          (sum: number, item: CreateOneTapSealItem) => sum + item.quantity,
          0,
        );

        lineItems.push({
          price_data: {
            currency: 'jpy',
            product_data: {
              name: 'ワンタップシール',
              description: 'NFCタグシール',
            },
            unit_amount: ONE_TAP_SEAL_CONFIG.UNIT_PRICE,
          },
          quantity: totalSealQuantity,
        });

        // 配送料（1回分）
        lineItems.push({
          price_data: {
            currency: 'jpy',
            product_data: {
              name: '配送料',
              description: 'クリックポスト',
            },
            unit_amount: ONE_TAP_SEAL_CONFIG.SHIPPING_FEE,
          },
          quantity: 1,
        });
      }

      // 🔧 一回限り決済として実行
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment', // 🔧 一回限り決済
        success_url: `${process.env.NEXTAUTH_URL}/dashboard/subscription?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/subscription?canceled=true`,
        metadata: {
          userId: session.user.id,
          plan: plan,
          interval: interval,
          isCorporate: isCorporate.toString(),
          oneTapSealOrder: oneTapSeal ? 'true' : 'false',
          subscriptionType: 'plan_with_onetap', // 🔧 Webhookで識別するためのフラグ
        },
        allow_promotion_codes: true,
      });

      logger.info('Stripe Checkout Session作成完了', {
        sessionId: checkoutSession.id,
        totalAmount,
        userId: session.user.id,
      });

      // データベーストランザクションで注文データを事前作成（pendingステータス）
      const result = await prisma.$transaction(async (tx) => {
        // 既存のSubscriptionをチェック（上書きしないように）
        const existingSubscription = await tx.subscription.findUnique({
          where: { userId: session.user.id },
        });

        let subscriptionRecord = null;
        let corporateTenant = null;

        // 法人プランの場合はテナントも作成する
        if (isCorporate) {
          logger.info('法人プラン登録処理を開始します');
          const companyName = user.company || '';

          try {
            const existingTenantAsAdmin = await tx.corporateTenant.findUnique({
              where: { adminId: session.user.id },
            });

            if (existingTenantAsAdmin) {
              logger.info('ユーザーは既に法人テナントの管理者です', {
                tenantId: existingTenantAsAdmin.id,
              });
              corporateTenant = existingTenantAsAdmin;
            } else {
              let maxUsers = 10;
              if (plan === 'business') {
                maxUsers = 30;
              } else if (plan === 'enterprise') {
                maxUsers = 50;
              }

              const newTenant = await tx.corporateTenant.create({
                data: {
                  name: companyName || '',
                  maxUsers: maxUsers,
                  adminId: session.user.id,
                  users: { connect: [{ id: session.user.id }] },
                  primaryColor: '#3B82F6',
                  secondaryColor: 'var(--color-corporate-secondary)',
                },
              });
              corporateTenant = newTenant;
              logger.info('法人テナント作成完了', { tenantId: corporateTenant.id });
            }

            await tx.user.update({
              where: { id: session.user.id },
              data: {
                corporateRole: 'admin',
              },
            });
          } catch (error) {
            logger.error('法人テナント作成エラー:', error);
            throw new Error(
              '法人テナントの作成に失敗しました。' + (error instanceof Error ? error.message : ''),
            );
          }
        }

        // 現在の日付と期間終了日を設定
        const now = new Date();
        const currentPeriodStart = now;
        const currentPeriodEnd = calculatePeriodEndDate(
          plan || 'monthly',
          interval || 'month',
          currentPeriodStart,
        );

        // サブスクリプション情報を pending 状態で作成
        const subscriptionData = {
          status: 'pending', // 決済完了後に active に変更
          plan: interval === 'year' ? `${plan || 'monthly'}_yearly` : plan || 'monthly',
          priceId: planInfo.priceId,
          subscriptionId: checkoutSession.id, // 一時的にCheckout Session IDを使用
          currentPeriodStart: currentPeriodStart,
          currentPeriodEnd: currentPeriodEnd,
          interval: interval || 'month',
          trialStart: null,
          trialEnd: null,
          cancelAtPeriodEnd: false,
        };

        if (existingSubscription) {
          subscriptionRecord = await tx.subscription.update({
            where: { userId: session.user.id },
            data: subscriptionData,
          });
        } else {
          subscriptionRecord = await tx.subscription.create({
            data: {
              userId: session.user.id,
              ...subscriptionData,
            },
          });
        }

        // 法人テナントとサブスクリプションの関連付け
        if (corporateTenant && subscriptionRecord) {
          await tx.corporateTenant.update({
            where: { id: corporateTenant.id },
            data: {
              subscriptionId: subscriptionRecord.id,
            },
          });
        }

        // ワンタップシール注文の事前作成（pendingステータス）
        let createdOneTapSealOrder = null;
        if (oneTapSeal && oneTapSeal.items && oneTapSeal.items.length > 0) {
          logger.info('ワンタップシール注文を事前作成中');

          const calculation = calculateOrderAmount(validatedOneTapSealItems);

          createdOneTapSealOrder = await tx.oneTapSealOrder.create({
            data: {
              userId: session.user.id,
              tenantId: isCorporate ? corporateTenant?.id : null,
              subscriptionId: subscriptionRecord?.id || null,
              orderType: isCorporate ? 'corporate' : 'individual',
              shippingAddress: oneTapSeal.shippingAddress, // JSONフィールドとして保存
              sealTotal: calculation.sealTotal,
              shippingFee: calculation.shippingFee,
              taxAmount: calculation.taxAmount,
              totalAmount: calculation.totalAmount,
              status: 'pending',
              stripePaymentIntentId: checkoutSession.id,
            },
          });

          // 注文アイテムを作成
          for (const item of oneTapSeal.items) {
            await tx.oneTapSealItem.create({
              data: {
                orderId: createdOneTapSealOrder.id,
                memberUserId: item.memberUserId,
                color: item.color,
                quantity: item.quantity,
                unitPrice: ONE_TAP_SEAL_CONFIG.UNIT_PRICE,
                profileSlug: item.profileSlug, // 追加
                qrSlug: item.qrSlug,
              },
            });

            // QRコードページが存在しない場合は作成
            const existingQrCode = await tx.qrCodePage.findUnique({
              where: { slug: item.qrSlug },
            });

            if (!existingQrCode) {
              const targetUser = await tx.user.findUnique({
                where: { id: item.memberUserId || session.user.id },
                select: { name: true, email: true },
              });

              await tx.qrCodePage.create({
                data: {
                  slug: item.qrSlug,
                  userId: item.memberUserId || session.user.id,
                  userName: targetUser?.name || targetUser?.email || item.qrSlug,
                  profileUrl: `https://app.sns-share.com/qr/${item.qrSlug}`,
                  template: 'default',
                  primaryColor: '#3B82F6',
                  secondaryColor: '#1E40AF',
                },
              });
            }
          }

          logger.info('ワンタップシール注文事前作成完了', {
            orderId: createdOneTapSealOrder.id,
            itemCount: calculation.itemCount,
            amount: calculation.totalAmount,
          });
        }

        return {
          subscription: subscriptionRecord,
          corporateTenant,
          oneTapSealOrder: createdOneTapSealOrder,
          checkoutSession,
        };
      });

      // レスポンス
      if (isCorporate) {
        return NextResponse.json({
          success: true,
          subscription: result.subscription,
          tenant: result.corporateTenant,
          oneTapSealOrder: result.oneTapSealOrder,
          checkoutUrl: result.checkoutSession.url,
          sessionId: result.checkoutSession.id,
          totalAmount: totalAmount,
          message: result.oneTapSealOrder
            ? '法人プランとワンタップシールの決済準備が完了しました'
            : '法人プランの決済準備が完了しました',
        });
      } else {
        return NextResponse.json({
          success: true,
          subscription: result.subscription,
          oneTapSealOrder: result.oneTapSealOrder,
          checkoutUrl: result.checkoutSession.url,
          sessionId: result.checkoutSession.id,
          totalAmount: totalAmount,
          message: result.oneTapSealOrder
            ? 'プランとワンタップシールの決済準備が完了しました'
            : 'プランの決済準備が完了しました',
        });
      }
    } catch (stripeError) {
      logger.error('Stripe処理エラー:', stripeError);
      return NextResponse.json({ error: '決済処理の準備に失敗しました' }, { status: 500 });
    }
  } catch (error) {
    logger.error('プラン作成エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'プランの作成に失敗しました';
    return NextResponse.json(
      { error: `プランの作成に失敗しました: ${errorMessage}` },
      { status: 500 },
    );
  }
}

// 🆕 ワンタップシール単独決済処理関数（ファイル末尾に追加）
async function handleOneTapSealOnlyCheckout(req: NextRequest, session: any, oneTapSeal: any) {
  try {
    logger.info('ワンタップシール単独決済開始', { userId: session.user.id });

    if (!oneTapSeal || !oneTapSeal.orderId) {
      return NextResponse.json({ error: '注文IDが必要です' }, { status: 400 });
    }

    // 注文の存在確認
    const order = await prisma.oneTapSealOrder.findFirst({
      where: {
        id: oneTapSeal.orderId,
        userId: session.user.id,
        status: 'pending',
      },
      include: {
        items: true,
        user: {
          select: {
            email: true,
            name: true,
            stripeCustomerId: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: '注文が見つからないか、既に処理済みです' },
        { status: 404 },
      );
    }

    // Stripeカスタマー取得
    let customerId = order.user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe!.customers.create({
        email: order.user.email,
        name: order.user.name || undefined,
        metadata: {
          userId: session.user.id,
        },
      });

      customerId = customer.id;

      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Checkout Session作成（ワンタップシール単独）
    const checkoutSession = await stripe!.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: 'ワンタップシール',
              description: `NFCタグシール ${order.items.reduce((sum, item) => sum + item.quantity, 0)}枚`,
            },
            unit_amount: ONE_TAP_SEAL_CONFIG.UNIT_PRICE,
          },
          quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
        },
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: '配送料',
              description: 'クリックポスト',
            },
            unit_amount: ONE_TAP_SEAL_CONFIG.SHIPPING_FEE,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/subscription?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/subscription?canceled=true`,
      metadata: {
        userId: session.user.id,
        orderId: order.id,
        subscriptionType: 'one_tap_seal_only',
      },
    });

    // 注文にCheckout Session IDを保存
    await prisma.oneTapSealOrder.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: checkoutSession.id },
    });

    logger.info('ワンタップシール単独Checkout Session作成完了', {
      sessionId: checkoutSession.id,
      orderId: order.id,
      amount: order.totalAmount,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
      orderId: order.id,
      totalAmount: order.totalAmount,
      message: 'ワンタップシール決済準備が完了しました',
    });

  } catch (error) {
    logger.error('ワンタップシール単独決済エラー:', error);
    return NextResponse.json(
      { error: 'ワンタップシール決済の準備に失敗しました' },
      { status: 500 },
    );
  }
}