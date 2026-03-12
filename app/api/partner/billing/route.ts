// app/api/partner/billing/route.ts
// パートナー請求管理API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  getStripeInstance,
  getPartnerPlanInfo,
  changePartnerPlan,
  createPartnerSubscription,
  cancelPartnerSubscription,
  createPartnerBillingPortalSession,
  PARTNER_PLAN_CONFIGS,
} from '@/lib/stripe';

// GET: パートナーの請求情報を取得
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const partner = await prisma.partner.findUnique({
      where: { adminUserId: session.user.id },
      select: {
        id: true,
        name: true,
        plan: true,
        billingStatus: true,
        billingEmail: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        accountStatus: true,
        trialEndsAt: true,
        maxAccounts: true,
      },
    });

    if (!partner) {
      return NextResponse.json({ error: 'パートナーが見つかりません' }, { status: 403 });
    }

    const planInfo = getPartnerPlanInfo(partner.plan);

    // Stripe から請求履歴を取得
    let invoices: any[] = [];
    let upcomingInvoice: any = null;
    let billingPortalUrl: string | null = null;

    if (partner.stripeCustomerId) {
      try {
        const stripeClient = getStripeInstance();

        const stripeInvoices = await stripeClient.invoices.list({
          customer: partner.stripeCustomerId,
          limit: 10,
        });

        invoices = stripeInvoices.data.map((inv) => ({
          id: inv.id,
          amount: (inv.amount_paid || 0) / 100,
          status: inv.status,
          date: inv.created ? new Date(inv.created * 1000).toISOString() : null,
          pdfUrl: inv.invoice_pdf,
          hostedUrl: inv.hosted_invoice_url,
        }));

        // 次回請求予定
        if (partner.stripeSubscriptionId) {
          try {
            const upcoming = await stripeClient.invoices.retrieveUpcoming({
              customer: partner.stripeCustomerId,
            });
            upcomingInvoice = {
              amount: (upcoming.amount_due || 0) / 100,
              date: upcoming.next_payment_attempt
                ? new Date(upcoming.next_payment_attempt * 1000).toISOString()
                : null,
            };
          } catch {
            // トライアル中など次回請求がない場合
          }
        }

        // Billing Portal URL
        const portalSession = await createPartnerBillingPortalSession(
          partner.id,
          `${process.env.NEXTAUTH_URL}/dashboard/partner/billing`,
        );
        billingPortalUrl = portalSession.url;
      } catch (error) {
        console.error('Stripe billing info fetch error:', error);
      }
    }

    return NextResponse.json({
      partner: {
        id: partner.id,
        name: partner.name,
        plan: partner.plan,
        planDisplayName: planInfo?.displayName || partner.plan,
        planAmount: planInfo?.amount || 0,
        billingStatus: partner.billingStatus,
        billingEmail: partner.billingEmail,
        accountStatus: partner.accountStatus,
        trialEndsAt: partner.trialEndsAt?.toISOString() || null,
        maxAccounts: partner.maxAccounts,
      },
      invoices,
      upcomingInvoice,
      billingPortalUrl,
      availablePlans: Object.values(PARTNER_PLAN_CONFIGS).map((p) => ({
        planId: p.planId,
        displayName: p.displayName,
        amount: p.amount,
        maxAccounts: p.maxAccounts,
      })),
    });
  } catch (error) {
    console.error('Partner billing GET error:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}

// POST: プラン変更・サブスクリプション操作
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const partner = await prisma.partner.findUnique({
      where: { adminUserId: session.user.id },
      select: {
        id: true,
        plan: true,
        stripeSubscriptionId: true,
        stripeCustomerId: true,
      },
    });

    if (!partner) {
      return NextResponse.json({ error: 'パートナーが見つかりません' }, { status: 403 });
    }

    const body = await req.json();
    const { action, plan: newPlan } = body;

    switch (action) {
      case 'change_plan': {
        if (!newPlan || !getPartnerPlanInfo(newPlan)) {
          return NextResponse.json({ error: '無効なプランです' }, { status: 400 });
        }
        if (newPlan === partner.plan) {
          return NextResponse.json({ error: '同じプランです' }, { status: 400 });
        }

        if (!partner.stripeSubscriptionId) {
          // サブスクリプション未作成の場合は新規作成
          const subscription = await createPartnerSubscription(partner.id, newPlan);
          return NextResponse.json({
            success: true,
            message: 'サブスクリプションを作成しました',
            subscriptionId: subscription.id,
          });
        }

        const subscription = await changePartnerPlan(partner.id, newPlan);
        return NextResponse.json({
          success: true,
          message: 'プランを変更しました',
          subscriptionId: subscription.id,
        });
      }

      case 'cancel': {
        if (!partner.stripeSubscriptionId) {
          return NextResponse.json(
            { error: 'サブスクリプションが見つかりません' },
            { status: 400 },
          );
        }
        await cancelPartnerSubscription(partner.id);
        return NextResponse.json({
          success: true,
          message: 'サブスクリプションのキャンセルを受け付けました（期間終了時に解約されます）',
        });
      }

      case 'create_subscription': {
        const plan = newPlan || partner.plan;
        if (partner.stripeSubscriptionId) {
          return NextResponse.json(
            { error: '既にサブスクリプションが存在します' },
            { status: 400 },
          );
        }
        const subscription = await createPartnerSubscription(partner.id, plan);
        return NextResponse.json({
          success: true,
          message: 'サブスクリプションを作成しました',
          subscriptionId: subscription.id,
        });
      }

      default:
        return NextResponse.json({ error: '無効なアクションです' }, { status: 400 });
    }
  } catch (error) {
    console.error('Partner billing POST error:', error);
    const message = error instanceof Error ? error.message : 'サーバーエラー';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
