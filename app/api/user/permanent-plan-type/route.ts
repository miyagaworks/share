// app/api/user/permanent-plan-type/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { PermanentPlanType, PLAN_TYPE_DISPLAY_NAMES } from '@/lib/corporateAccess';

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
  [PermanentPlanType.BUSINESS]: {
    maxUsers: 10,
    allowedFeatures: [
      '法人プロフィール',
      '最大10名のユーザー管理',
      '共通SNS設定',
      'ブランディング設定',
    ],
    restrictions: ['最大10名までのユーザー登録に制限されます'],
  },
  [PermanentPlanType.BUSINESS_PLUS]: {
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

export async function GET() {
  try {
    // セッション認証チェック
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ユーザーが存在するか確認（metadataを削除）
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionStatus: true,
        // metadataテーブルは存在しないので削除
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 永久利用権ユーザーでない場合
    if (user.subscriptionStatus !== 'permanent') {
      return NextResponse.json({ isPermanent: false });
    }

    // 現在はプラン種別情報がないため、デフォルト値を返す
    const planType = PermanentPlanType.PERSONAL;

    // 拡張された情報を返す
    return NextResponse.json({
      isPermanent: true,
      planType: planType,
      displayName: PLAN_TYPE_DISPLAY_NAMES[planType],
      maxUsers: PLAN_FEATURES[planType].maxUsers,
      allowedFeatures: PLAN_FEATURES[planType].allowedFeatures,
      restrictions: PLAN_FEATURES[planType].restrictions,
    });
  } catch (error) {
    console.error('永久利用権プラン取得エラー:', error);
    return NextResponse.json({ error: '内部サーバーエラー' }, { status: 500 });
  }
}