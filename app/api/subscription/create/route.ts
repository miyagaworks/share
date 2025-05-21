// app/api/subscription/create/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isStripeAvailable } from '@/lib/stripe';
import { checkPermanentAccess } from '@/lib/corporateAccess';

// プランに基づいて適切な期間終了日を計算する関数
function calculatePeriodEndDate(plan: string, interval: string, startDate: Date): Date {
  console.log(`計算開始日: ${startDate.toISOString()}, interval: ${interval}`);

  const endDate = new Date(startDate);

  if (interval === 'year') {
    // 年間プランの場合は1年後
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    // 月額プランの場合は1ヶ月後
    endDate.setMonth(endDate.getMonth() + 1);
  }

  console.log(`計算終了日: ${endDate.toISOString()}`);
  return endDate;
}

// POST ハンドラー内
export async function POST(req: NextRequest) {
  try {
    // リクエストログ
    console.log('プラン作成リクエスト受信');
    console.log('現在のサーバー時間:', new Date().toISOString());

    const session = await auth();

    if (!session?.user?.id) {
      console.log('認証エラー: ユーザーIDが見つかりません');
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 永久利用権チェック（リファクタリング後のAPI使用）
    // クライアントサイドで不可能にするだけでなく、サーバーサイドでも二重チェック
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

    // 本番環境でStripeが利用可能かどうかをチェック
    if (process.env.NODE_ENV === 'production' && !isStripeAvailable()) {
      console.error('本番環境でStripe APIキーが設定されていません');
      return NextResponse.json(
        { error: '決済システムが正しく構成されていません。管理者にお問い合わせください。' },
        { status: 500 },
      );
    }

    // リクエストボディのパース
    const body = await req.json();
    console.log('リクエストボディ:', body);

    const { priceId, paymentMethodId, plan, interval = 'month', isCorporate = false } = body;

    // 必須パラメータの検証
    if (!priceId || !paymentMethodId) {
      console.log('パラメータエラー:', { priceId, paymentMethodId });
      return NextResponse.json({ error: '必要なパラメータが不足しています' }, { status: 400 });
    }

    // ========= ここから追加：テストカードによる失敗シミュレーション =========
    // 特定のテストカード番号を検出して適切にエラーを返す
    // paymentMethodIdから判断（実際にはStripeAPIからの応答に基づく）
    if (paymentMethodId.includes('failed') || paymentMethodId.includes('insufficient_funds')) {
      console.log('テストカードによる支払い失敗をシミュレート:', paymentMethodId);
      return NextResponse.json(
        {
          error: '支払い処理に失敗しました: 残高不足',
          code: 'card_declined',
          decline_code: 'insufficient_funds',
        },
        { status: 400 },
      );
    }

    console.log('ユーザー情報取得開始:', session.user.id);

    // ユーザー情報を取得
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
      console.log('ユーザーが見つかりません:', session.user.id);
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 永久利用権チェック（データベースから直接チェック）
    if (user.subscriptionStatus === 'permanent') {
      return NextResponse.json(
        {
          error: '永久利用権ユーザーはプランを変更できません',
          code: 'permanent_user_restriction',
        },
        { status: 403 },
      );
    }

    console.log('ユーザー情報:', user);

    // 開発環境用のモックデータ
    // 本番環境ではこの部分を実際のStripe統合に置き換える
    const mockCustomerId = `cus_mock_${Math.random().toString(36).substring(2, 10)}`;
    const now = new Date();
    console.log(
      '計算されるトライアル終了日:',
      new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    );
    const mockSubscription = {
      id: `sub_mock_${Math.random().toString(36).substring(2, 10)}`,
      status: 'active',
      current_period_start: Math.floor(now.getTime() / 1000),
      current_period_end: Math.floor(now.getTime() / 1000) + 30 * 24 * 60 * 60,
      latest_invoice: {
        payment_intent: {
          client_secret: `pi_secret_mock_${Math.random().toString(36).substring(2, 10)}`,
        },
      },
    };

    // ユーザーのStripeCustomerIdを更新
    if (!user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          stripeCustomerId: mockCustomerId,
          subscriptionStatus: 'active',
          trialEndsAt: null,
        },
      });
    }

    // 既存のサブスクリプションをチェック
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    // 法人プランの場合はテナントも作成する
    let corporateTenant = null;
    if (isCorporate) {
      console.log('法人プラン登録処理を開始します');
      // ユーザー名または会社名を取得
      const companyName = user.company || ''; // 空欄にして、オンボーディングで設定させる

      try {
        // ユーザーがすでに法人テナントの管理者かどうかを確認
        const existingTenantAsAdmin = await prisma.corporateTenant.findUnique({
          where: { adminId: session.user.id },
        });

        // 既に管理者の場合は新規作成せず、既存のテナントを使用
        if (existingTenantAsAdmin) {
          console.log('ユーザーは既に法人テナントの管理者です:', existingTenantAsAdmin.id);
          corporateTenant = existingTenantAsAdmin;
        } else {
          // プランに基づいてユーザー数上限を設定
          let maxUsers = 10; // デフォルト値
          if (plan === 'business') {
            maxUsers = 30;
          } else if (plan === 'enterprise') {
            maxUsers = 50;
          } else if (plan === 'business-plus' || plan === 'business_plus') {
            // 互換性のため
            maxUsers = 30;
          }

          // 法人テナントを作成
          const newTenant = await prisma.corporateTenant.create({
            data: {
              name: companyName || '', // 空の文字列を設定し、後でユーザーに入力させる
              maxUsers: maxUsers,
              adminId: session.user.id,
              users: { connect: [{ id: session.user.id }] },
              primaryColor: '#3B82F6',
              secondaryColor: 'var(--color-corporate-secondary)',
            },
          });
          corporateTenant = newTenant;
          console.log('法人テナント作成完了:', corporateTenant.id);
        }

        // ユーザーに法人ロールを設定
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            corporateRole: 'admin',
          },
        });
      } catch (error) {
        console.error('法人テナント作成エラー:', error);
        throw new Error(
          '法人テナントの作成に失敗しました。' + (error instanceof Error ? error.message : ''),
        );
      }
    }

    // 現在の日付と期間終了日を設定
    const currentPeriodStart = now;
    const currentPeriodEnd = calculatePeriodEndDate(
      plan || 'monthly',
      interval || 'month',
      currentPeriodStart,
    );

    console.log('期間設定:', {
      plan: plan || 'monthly',
      interval: interval || 'month',
      currentPeriodStart: currentPeriodStart.toISOString(),
      currentPeriodEnd: currentPeriodEnd.toISOString(),
    });

    // ご利用プラン情報を更新または作成
    const subscriptionData = {
      status: 'active',
      // interval が 'year' の場合は、plan に _yearly を追加
      plan: interval === 'year' ? `${plan || 'monthly'}_yearly` : plan || 'monthly',
      priceId,
      subscriptionId: mockSubscription.id,
      currentPeriodStart: currentPeriodStart,
      currentPeriodEnd: currentPeriodEnd,
      interval: interval || 'month',
      trialStart: null,
      trialEnd: null,
      cancelAtPeriodEnd: false,
    };

    let newSubscription;

    if (existingSubscription) {
      // 既存のサブスクリプションを更新
      newSubscription = await prisma.subscription.update({
        where: { userId: session.user.id },
        data: subscriptionData,
      });
    } else {
      // 新規サブスクリプションを作成
      newSubscription = await prisma.subscription.create({
        data: {
          userId: session.user.id,
          ...subscriptionData,
        },
      });
    }

    // 法人テナントとサブスクリプションの関連付け
    if (corporateTenant && newSubscription) {
      try {
        // 明示的なエラーログを追加
        console.log('法人テナントとサブスクリプションの関連付けを開始します', {
          tenantId: corporateTenant.id,
          subscriptionId: newSubscription.id,
        });

        await prisma.corporateTenant.update({
          where: { id: corporateTenant.id },
          data: {
            subscriptionId: newSubscription.id,
          },
        });

        // 関連付けが成功したか確認
        const updatedTenant = await prisma.corporateTenant.findUnique({
          where: { id: corporateTenant.id },
          select: { subscriptionId: true },
        });

        console.log('法人テナントとサブスクリプションの関連付け結果:', updatedTenant);

        if (updatedTenant?.subscriptionId !== newSubscription.id) {
          console.error('関連付けは成功したが、値が反映されていません');
        }
      } catch (error) {
        console.error('法人テナントとサブスクリプションの関連付けに失敗:', error);
        // エラーのより詳細な情報をログに出力
        if (error instanceof Error) {
          console.error('エラータイプ:', error.name);
          console.error('エラーメッセージ:', error.message);
          console.error('スタックトレース:', error.stack);
        }
      }
    }

    // ClientSecret情報を取得
    const clientSecret = mockSubscription.latest_invoice?.payment_intent?.client_secret || null;

    // 法人プランの場合は専用のレスポンスを返す
    if (isCorporate) {
      return NextResponse.json({
        success: true,
        subscription: newSubscription,
        tenant: corporateTenant,
        clientSecret: clientSecret,
        message: '法人プランが正常に作成されました',
        redirectUrl: `/dashboard/corporate/onboarding?tenant=${corporateTenant?.id}`,
      });
    } else {
      // 個人プランの場合は従来通り
      return NextResponse.json({
        success: true,
        subscription: newSubscription,
        clientSecret,
        message: 'プランが正常に作成されました',
      });
    }
  } catch (error) {
    console.error('プラン作成エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'プランの作成に失敗しました';
    return NextResponse.json(
      { error: `プランの作成に失敗しました: ${errorMessage}` },
      { status: 500 },
    );
  }
}