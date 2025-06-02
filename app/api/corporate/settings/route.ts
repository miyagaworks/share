// app/api/corporate/settings/route.ts (完全修正版)
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
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
        email: true,
        subscriptionStatus: true,
        adminOfTenant: {
          select: {
            id: true,
            name: true,
            securitySettings: true,
            notificationSettings: true,
            billingAddress: true,
            billingEmail: true,
            billingContact: true,
            accountStatus: true,
            dataRetentionDays: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            securitySettings: true,
            notificationSettings: true,
            billingAddress: true,
            billingEmail: true,
            billingContact: true,
            accountStatus: true,
            dataRetentionDays: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 永久利用権ユーザーの場合、実際のテナント情報または仮想テナントの設定情報を返す
    if (user.subscriptionStatus === 'permanent') {
      logger.debug('永久利用権ユーザー用設定情報の取得:', user.id);

      // 実際のテナントがある場合はそれを使用
      const actualTenant = user.adminOfTenant || user.tenant;
      if (actualTenant) {
        return NextResponse.json({
          success: true,
          settings: {
            name: actualTenant.name,
            securitySettings: actualTenant.securitySettings,
            notificationSettings: actualTenant.notificationSettings,
            billingAddress: actualTenant.billingAddress,
            billingEmail: actualTenant.billingEmail,
            billingContact: actualTenant.billingContact,
            accountStatus: actualTenant.accountStatus,
            dataRetentionDays: actualTenant.dataRetentionDays,
          },
          isAdmin: true,
        });
      }

      // 実際のテナントがない場合は仮想テナント情報を生成
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

    // 通常の法人ユーザーの処理
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
    logger.error('法人アカウント設定取得エラー:', error);
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

    const body = await req.json();
    const { name: bodyName, type } = body;

    // ユーザーとテナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionStatus: true,
        adminOfTenant: {
          select: {
            id: true,
            name: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 🔥 永久利用権ユーザーの場合の処理
    if (user.subscriptionStatus === 'permanent') {
      const actualTenant = user.adminOfTenant || user.tenant;

      if (actualTenant && type === 'general' && bodyName) {
        // 実際のテナントがある場合は通常の更新処理を実行
        logger.debug('永久利用権ユーザーの実テナント更新:', {
          userId: user.id,
          tenantId: actualTenant.id,
          oldName: actualTenant.name,
          newName: bodyName,
        });

        // 実際のテナント名を更新
        const updatedTenant = await prisma.corporateTenant.update({
          where: { id: actualTenant.id },
          data: { name: bodyName },
        });

        logger.info('永久利用権ユーザーテナント名更新完了:', {
          tenantId: updatedTenant.id,
          newName: updatedTenant.name,
        });

        return NextResponse.json({
          success: true,
          message: '設定を更新しました',
          tenant: {
            ...updatedTenant,
            name: bodyName,
          },
          updatedType: type,
          isVirtual: false,
          requiresCacheClear: true, // 🔥 キャッシュクリア必須
          isPermanentUser: true, // 🔥 永久利用権ユーザーフラグ
        });
      } else if (type === 'general') {
        // 実際のテナントがない場合は仮想的な成功レスポンス
        logger.debug('永久利用権ユーザーの仮想テナント更新:', {
          userId: user.id,
          newName: bodyName,
        });

        return NextResponse.json({
          success: true,
          message: '設定を更新しました',
          tenant: {
            name: bodyName || `${user.name || 'ユーザー'}の法人`,
            securitySettings: body.securitySettings || null,
            notificationSettings: body.notificationSettings || null,
            billingAddress: body.billingAddress || null,
            billingEmail: body.billingEmail || null,
            billingContact: body.billingContact || null,
          },
          updatedType: type,
          isVirtual: true,
          requiresCacheClear: true, // 🔥 仮想テナントもキャッシュクリア必須
          isPermanentUser: true,
        });
      }

      // その他の設定タイプ（security, notifications, billing）の処理
      if (type !== 'general') {
        return NextResponse.json({
          success: true,
          message: '設定を更新しました',
          tenant: {
            name: actualTenant?.name || `${user.name || 'ユーザー'}の法人`,
            securitySettings: body.securitySettings || null,
            notificationSettings: body.notificationSettings || null,
            billingAddress: body.billingAddress || null,
            billingEmail: body.billingEmail || null,
            billingContact: body.billingContact || null,
          },
          updatedType: type,
          isVirtual: !actualTenant,
          requiresCacheClear: false,
          isPermanentUser: true,
        });
      }
    }

    // 管理者権限の確認（通常の法人ユーザー）
    const isAdmin = !!user.adminOfTenant;
    if (!isAdmin) {
      return NextResponse.json(
        { error: '法人アカウント設定の変更には管理者権限が必要です' },
        { status: 403 },
      );
    }

    const tenantId = user.adminOfTenant!.id;

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
        if (body.onboardingCompleted === undefined && (!bodyName || bodyName.trim() === '')) {
          return NextResponse.json({ error: '会社名は必須です' }, { status: 400 });
        }
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

    // トランザクションを使用して更新
    const result = await prisma.$transaction(async (tx) => {
      const updatedTenant = await tx.corporateTenant.update({
        where: { id: tenantId },
        data: updateData,
      });

      // 設定変更の記録をBillingRecordに保存
      await tx.billingRecord.create({
        data: {
          userId: session.user.id,
          amount: 0,
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
        securitySettings: result.securitySettings,
      },
      message: '法人アカウント設定を更新しました',
      updatedType: type,
      isVirtual: false,
      requiresCacheClear: false,
      isPermanentUser: false,
    });
  } catch (error) {
    logger.error('法人アカウント設定更新エラー:', error);
    return NextResponse.json({ error: '法人アカウント設定の更新に失敗しました' }, { status: 500 });
  }
}