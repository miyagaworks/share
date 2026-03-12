// app/api/admin/partners/[partnerId]/billing/route.ts
// Super Admin がパートナーの課金を管理するAPI
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/auth/constants';
import {
  getStripeInstance,
  getPartnerPlanInfo,
  createPartnerSubscription,
  cancelPartnerSubscription,
  changePartnerPlan,
  PARTNER_PLAN_CONFIGS,
} from '@/lib/stripe';

// GET: パートナーの課金情報取得
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    const { partnerId } = await params;

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        name: true,
        brandName: true,
        plan: true,
        billingStatus: true,
        billingEmail: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        accountStatus: true,
        trialEndsAt: true,
        maxAccounts: true,
        adminUser: { select: { email: true, name: true } },
      },
    });

    if (!partner) {
      return NextResponse.json({ error: 'パートナーが見つかりません' }, { status: 404 });
    }

    const planInfo = getPartnerPlanInfo(partner.plan);

    // Stripe 情報取得
    let stripeSubscription: any = null;
    let invoices: any[] = [];

    if (partner.stripeCustomerId) {
      try {
        const stripeClient = getStripeInstance();

        if (partner.stripeSubscriptionId) {
          const sub = await stripeClient.subscriptions.retrieve(partner.stripeSubscriptionId);
          stripeSubscription = {
            id: sub.id,
            status: sub.status,
            currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
            currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            trialEnd: sub.trial_end
              ? new Date(sub.trial_end * 1000).toISOString()
              : null,
          };
        }

        const stripeInvoices = await stripeClient.invoices.list({
          customer: partner.stripeCustomerId,
          limit: 20,
        });

        invoices = stripeInvoices.data.map((inv) => ({
          id: inv.id,
          amount: (inv.amount_paid || 0) / 100,
          status: inv.status,
          date: inv.created ? new Date(inv.created * 1000).toISOString() : null,
          pdfUrl: inv.invoice_pdf,
        }));
      } catch (error) {
        console.error('Stripe info fetch error:', error);
      }
    }

    return NextResponse.json({
      partner: {
        id: partner.id,
        name: partner.name,
        brandName: partner.brandName,
        plan: partner.plan,
        planDisplayName: planInfo?.displayName || partner.plan,
        planAmount: planInfo?.amount || 0,
        billingStatus: partner.billingStatus,
        billingEmail: partner.billingEmail,
        accountStatus: partner.accountStatus,
        trialEndsAt: partner.trialEndsAt?.toISOString() || null,
        maxAccounts: partner.maxAccounts,
        adminEmail: partner.adminUser.email,
      },
      stripeSubscription,
      invoices,
      availablePlans: Object.values(PARTNER_PLAN_CONFIGS).map((p) => ({
        planId: p.planId,
        displayName: p.displayName,
        amount: p.amount,
        maxAccounts: p.maxAccounts,
      })),
    });
  } catch (error) {
    console.error('Admin partner billing GET error:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}

// POST: Super Admin によるパートナー課金操作
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    const { partnerId } = await params;
    const body = await req.json();
    const { action, plan: newPlan, billingStatus } = body;

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        plan: true,
        stripeSubscriptionId: true,
        stripeCustomerId: true,
      },
    });

    if (!partner) {
      return NextResponse.json({ error: 'パートナーが見つかりません' }, { status: 404 });
    }

    switch (action) {
      case 'create_subscription': {
        const plan = newPlan || partner.plan;
        const subscription = await createPartnerSubscription(partnerId, plan);
        return NextResponse.json({
          success: true,
          message: 'サブスクリプションを作成しました',
          subscriptionId: subscription.id,
        });
      }

      case 'change_plan': {
        if (!newPlan || !getPartnerPlanInfo(newPlan)) {
          return NextResponse.json({ error: '無効なプランです' }, { status: 400 });
        }
        if (!partner.stripeSubscriptionId) {
          const subscription = await createPartnerSubscription(partnerId, newPlan);
          return NextResponse.json({
            success: true,
            message: 'サブスクリプションを作成しました',
            subscriptionId: subscription.id,
          });
        }
        const subscription = await changePartnerPlan(partnerId, newPlan);
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
        await cancelPartnerSubscription(partnerId);
        return NextResponse.json({
          success: true,
          message: 'サブスクリプションをキャンセルしました',
        });
      }

      case 'update_billing_status': {
        if (!billingStatus) {
          return NextResponse.json({ error: 'billingStatus が必要です' }, { status: 400 });
        }
        await prisma.partner.update({
          where: { id: partnerId },
          data: { billingStatus },
        });
        return NextResponse.json({
          success: true,
          message: `課金ステータスを ${billingStatus} に更新しました`,
        });
      }

      default:
        return NextResponse.json({ error: '無効なアクションです' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin partner billing POST error:', error);
    const message = error instanceof Error ? error.message : 'サーバーエラー';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
