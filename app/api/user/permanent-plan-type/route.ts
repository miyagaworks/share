// app/api/user/permanent-plan-type/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// 🔥 新しいプラン構成に合わせた定義
export enum PermanentPlanType {
  PERSONAL = 'personal',
  STARTER = 'starter', // 10名まで（旧BUSINESS）
  BUSINESS = 'business', // 30名まで（旧BUSINESS_PLUS）
  ENTERPRISE = 'enterprise', // 50名まで
}

export const PLAN_TYPE_DISPLAY_NAMES: Record<PermanentPlanType, string> = {
  [PermanentPlanType.PERSONAL]: '個人プラン',
  [PermanentPlanType.STARTER]: 'スタータープラン (10名まで)',
  [PermanentPlanType.BUSINESS]: 'ビジネスプラン (30名まで)',
  [PermanentPlanType.ENTERPRISE]: 'エンタープライズプラン (50名まで)',
};

// プラン種別ごとの機能・制限を定義
interface PlanFeatures {
  maxUsers: number;
  allowedFeatures: string[];
  restrictions: string[];
}

// プラン種別ごとの機能・制限マッピング
const PLAN_FEATURES: Record<PermanentPlanType, PlanFeatures> = {
  [PermanentPlanType.PERSONAL]: {
    maxUsers: 1,
    allowedFeatures: ['個人プロフィール', 'SNSリンク管理', 'デザインカスタマイズ', 'QRコード生成'],
    restrictions: ['法人機能は利用できません'],
  },
  [PermanentPlanType.STARTER]: {
    maxUsers: 10,
    allowedFeatures: [
      '法人プロフィール',
      '最大10名のユーザー管理',
      '共通SNS設定',
      'ブランディング設定',
    ],
    restrictions: ['最大10名までのユーザー登録に制限されます'],
  },
  [PermanentPlanType.BUSINESS]: {
    maxUsers: 30,
    allowedFeatures: [
      '法人プロフィール',
      '最大30名のユーザー管理',
      '共通SNS設定',
      'ブランディング設定',
      '部署管理',
    ],
    restrictions: ['最大30名までのユーザー登録に制限されます'],
  },
  [PermanentPlanType.ENTERPRISE]: {
    maxUsers: 50,
    allowedFeatures: [
      '法人プロフィール',
      '最大50名のユーザー管理',
      '共通SNS設定',
      'ブランディング設定',
      '部署管理',
      '高度なカスタマイズ',
    ],
    restrictions: ['最大50名までのユーザー登録に制限されます'],
  },
};

/**
 * ユーザーの永久利用権プラン種別を判定する関数
 * サブスクリプション情報やテナント情報から推測
 */
function determinePlanType(user: any): PermanentPlanType {
  // 🔥 新しいロジック: サブスクリプションのplanフィールドから判定
  if (user.subscription?.plan) {
    const plan = user.subscription.plan.toLowerCase();

    // 具体的なプラン名から判定
    if (plan.includes('permanent_enterprise') || plan.includes('enterprise')) {
      return PermanentPlanType.ENTERPRISE;
    } else if (plan.includes('permanent_business') || plan.includes('business')) {
      return PermanentPlanType.BUSINESS;
    } else if (
      plan.includes('business_plus') ||
      plan.includes('business-plus') ||
      plan.includes('businessplus')
    ) {
      return PermanentPlanType.BUSINESS; // 🔥 旧business_plusはBUSINESSにマッピング
    } else if (plan.includes('permanent_starter') || plan.includes('starter')) {
      return PermanentPlanType.STARTER;
    } else if (plan.includes('permanent_personal') || plan.includes('personal')) {
      return PermanentPlanType.PERSONAL;
    }

    // プランが'permanent'の場合は、intervalやその他の情報から判定
    if (plan === 'permanent') {
      // テナント情報がある場合は法人プラン
      if (user.adminOfTenant || user.tenant) {
        const tenant = user.adminOfTenant || user.tenant;
        const maxUsers = tenant?.maxUsers || 10;

        if (maxUsers >= 50) {
          return PermanentPlanType.ENTERPRISE;
        } else if (maxUsers >= 30) {
          return PermanentPlanType.BUSINESS;
        } else {
          return PermanentPlanType.STARTER;
        }
      }
      // テナント情報がない場合は個人プラン
      return PermanentPlanType.PERSONAL;
    }
  }

  // 🔥 フォールバック: テナント情報から判定
  if (user.adminOfTenant || user.tenant) {
    const tenant = user.adminOfTenant || user.tenant;
    const maxUsers = tenant?.maxUsers || 10;

    if (maxUsers >= 50) {
      return PermanentPlanType.ENTERPRISE;
    } else if (maxUsers >= 30) {
      return PermanentPlanType.BUSINESS;
    } else {
      return PermanentPlanType.STARTER; // 10名はSTARTER
    }
  }

  // 🔥 デフォルト: 個人プラン
  return PermanentPlanType.PERSONAL;
}

export async function GET() {
  try {
    // セッション認証チェック
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ユーザー情報を詳細に取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionStatus: true,
        subscription: {
          select: {
            plan: true,
            interval: true,
            status: true,
          },
        },
        adminOfTenant: {
          select: {
            id: true,
            name: true,
            maxUsers: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            maxUsers: true,
          },
        },
        corporateRole: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 永久利用権ユーザーでない場合
    if (user.subscriptionStatus !== 'permanent') {
      return NextResponse.json({
        isPermanent: false,
        planType: null,
        displayName: null,
        maxUsers: 0,
        allowedFeatures: [],
        restrictions: [],
      });
    }

    // プラン種別を判定
    const planType = determinePlanType(user);
    const features = PLAN_FEATURES[planType];

    logger.info('永久利用権プラン種別判定', {
      userId: session.user.id,
      planType,
      hasSubscription: !!user.subscription,
      subscriptionPlan: user.subscription?.plan,
      hasAdminTenant: !!user.adminOfTenant,
      hasTenant: !!user.tenant,
      tenantMaxUsers: user.adminOfTenant?.maxUsers || user.tenant?.maxUsers,
    });

    // 拡張された情報を返す
    return NextResponse.json({
      isPermanent: true,
      planType: planType,
      displayName: PLAN_TYPE_DISPLAY_NAMES[planType],
      maxUsers: features.maxUsers,
      allowedFeatures: features.allowedFeatures,
      restrictions: features.restrictions,
      tenant:
        user.adminOfTenant || user.tenant
          ? {
              id: (user.adminOfTenant || user.tenant)?.id,
              name: (user.adminOfTenant || user.tenant)?.name,
              maxUsers: (user.adminOfTenant || user.tenant)?.maxUsers,
              isAdmin: !!user.adminOfTenant,
            }
          : null,
    });
  } catch (error) {
    logger.error('永久利用権プラン取得エラー:', error);
    return NextResponse.json(
      {
        error: '内部サーバーエラー',
        isPermanent: false,
        planType: null,
      },
      { status: 500 },
    );
  }
}