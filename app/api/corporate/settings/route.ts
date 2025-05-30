// app/api/corporate/settings/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { generateVirtualTenantData } from '@/lib/corporateAccess';

// 法人アカウント設定の取得（GET）
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // ユーザーのテナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true, // メールアドレスを追加
        subscriptionStatus: true, // 永久利用権ユーザー判定用
        adminOfTenant: true,
        tenant: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 永久利用権ユーザーの場合、仮想テナントの設定情報を返す
    if (user.subscriptionStatus === 'permanent') {
      console.log('永久利用権ユーザー用仮想設定情報の生成:', user.id);
      const virtualTenant = generateVirtualTenantData(user.id, user.name);

      const virtualSettings = {
        name: virtualTenant.name,
        securitySettings: { passwordPolicy: 'standard', mfaEnabled: false },
        notificationSettings: { emailNotifications: true, appNotifications: true },
        billingAddress: { country: 'Japan', city: '', postalCode: '', address: '' },
        billingEmail: user.email || '',
        billingContact: user.name || '永久利用権ユーザー',
        accountStatus: 'active',
        dataRetentionDays: 365,
      };

      return NextResponse.json({
        success: true,
        settings: virtualSettings,
        isAdmin: true,
      });
    }

    // テナント情報を取得（管理者または一般メンバーのいずれか）
    const tenant = user.adminOfTenant || user.tenant;

    if (!tenant) {
      return NextResponse.json({ error: '法人テナント情報が見つかりません' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      settings: {
        name: tenant.name,
        securitySettings: tenant.securitySettings,
        notificationSettings: tenant.notificationSettings,
        billingAddress: tenant.billingAddress,
        billingEmail: tenant.billingEmail,
        billingContact: tenant.billingContact,
        accountStatus: tenant.accountStatus,
        dataRetentionDays: tenant.dataRetentionDays,
      },
      isAdmin: !!user.adminOfTenant,
    });
  } catch (error) {
    console.error('法人アカウント設定取得エラー:', error);
    return NextResponse.json({ error: '法人アカウント設定の取得に失敗しました' }, { status: 500 });
  }
}

// 法人アカウント基本設定の更新（PUT）
export async function PUT(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // リクエストボディの取得
    const body = await req.json();
    const { name: bodyName, type } = body;

    // ユーザーとテナント情報を取得（tenant情報も含める）
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true, // 名前を追加
        email: true, // メールアドレスを追加
        subscriptionStatus: true, // 永久利用権ユーザー判定用
        adminOfTenant: true,
        tenant: true, // テナント情報も含める
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 永久利用権ユーザーの場合、設定の更新はサポートしない
    if (user.subscriptionStatus === 'permanent') {
      // 設定更新リクエストを送信するとエラーではなく、成功と見なす
      return NextResponse.json({
        success: true,
        message: '永久利用権ユーザーの設定は更新されません',
        tenant: {
          name: bodyName || `${user.name || 'ユーザー'}の法人`,
          // フロントエンドの表示用に他のフィールドも含める
          securitySettings: body.securitySettings || null,
          notificationSettings: body.notificationSettings || null,
          billingAddress: body.billingAddress || null,
          billingEmail: body.billingEmail || null,
          billingContact: body.billingContact || null,
        },
        updatedType: type,
      });
    }

    // 管理者権限の確認（adminOfTenantが存在するか）
    const isAdmin = !!user.adminOfTenant;

    if (!isAdmin) {
      return NextResponse.json(
        { error: '法人アカウント設定の変更には管理者権限が必要です' },
        { status: 403 },
      );
    }

    // tenantIdを一度だけ宣言（nullチェック付き）
    if (!user.adminOfTenant) {
      return NextResponse.json({ error: '管理者のテナント情報が見つかりません' }, { status: 404 });
    }

    const tenantId = user.adminOfTenant.id;

    // 更新する設定タイプに基づいて更新データを準備
    type UpdateData = {
      name?: string;
      securitySettings?: Prisma.InputJsonValue;
      notificationSettings?: Prisma.InputJsonValue;
      billingAddress?: Prisma.InputJsonValue;
      billingEmail?: string;
      billingContact?: string;
      onboardingCompleted?: boolean;
    };

    let updateData: UpdateData = {};
    let billingDescription = '';

    switch (type) {
      case 'general':
        // 必須フィールドの検証（onboardingCompletedが存在する場合は検証をスキップ）
        if (body.onboardingCompleted === undefined && (!bodyName || bodyName.trim() === '')) {
          return NextResponse.json({ error: '会社名は必須です' }, { status: 400 });
        }

        // オブジェクトリテラルを一度に代入する方式に変更
        updateData = {
          ...(bodyName && { name: bodyName }),
          ...(body.onboardingCompleted !== undefined && {
            onboardingCompleted: !!body.onboardingCompleted,
          }),
        };

        billingDescription = '基本設定の更新';
        break;

      case 'security':
        const { securitySettings } = body;
        updateData.securitySettings = securitySettings;
        billingDescription = 'セキュリティ設定の更新';
        break;

      case 'notifications':
        const { notificationSettings } = body;
        updateData.notificationSettings = notificationSettings;
        billingDescription = '通知設定の更新';
        break;

      case 'billing':
        const { billingAddress, billingEmail, billingContact } = body;
        updateData.billingAddress = billingAddress;
        updateData.billingEmail = billingEmail;
        updateData.billingContact = billingContact;
        billingDescription = '請求情報の更新';
        break;

      default:
        return NextResponse.json({ error: '無効な設定タイプです' }, { status: 400 });
    }

    // トランザクションを使用して、テナント更新とBillingRecordの作成を一括で行う
    const result = await prisma.$transaction(async (tx) => {
      // テナント情報を更新
      const updatedTenant = await tx.corporateTenant.update({
        where: { id: tenantId },
        data: updateData,
      });

      // 設定変更の記録をBillingRecordに保存
      await tx.billingRecord.create({
        data: {
          userId: session.user.id,
          amount: 0, // 設定変更は0円
          status: 'paid',
          description: billingDescription,
          paidAt: new Date(),
        },
      });

      return updatedTenant;
    });

    return NextResponse.json({
      success: true,
      tenant: {
        ...result,
        securitySettings: result.securitySettings, // これが重要！明示的にsecuritySettingsを含める
      },
      message: '法人アカウント設定を更新しました',
      updatedType: type, // どの種類の設定が更新されたかも返す
    });
  } catch (error) {
    console.error('法人アカウント設定更新エラー:', error);
    return NextResponse.json({ error: '法人アカウント設定の更新に失敗しました' }, { status: 500 });
  }
}