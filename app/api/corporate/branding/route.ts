// app/api/corporate/branding/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logCorporateActivity } from '@/lib/utils/activity-logger';

// ブランディング設定の取得（GET）
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
        subscriptionStatus: true,
        adminOfTenant: true,
        tenant: true,
        image: true,
        mainColor: true,
        headerText: true,
        textColor: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 永久利用権ユーザーの場合、Userテーブルから直接ブランディング情報を返す
    if (user.subscriptionStatus === 'permanent') {
      logger.debug('永久利用権ユーザーのブランディング情報を取得:', user.id);

      return NextResponse.json({
        success: true,
        branding: {
          logoUrl: user.image || null,
          logoWidth: null,
          logoHeight: null,
          primaryColor: user.mainColor || '#3B82F6',
          secondaryColor: user.mainColor || '#3B82F6',
          headerText: user.headerText || null,
          textColor: user.textColor || '#FFFFFF',
        },
      });
    }

    // テナント情報を取得（管理者または一般メンバーのいずれか）
    const tenant = user.adminOfTenant || user.tenant;
    if (!tenant) {
      return NextResponse.json({ error: '法人テナント情報が見つかりません' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      branding: {
        logoUrl: tenant.logoUrl,
        logoWidth: tenant.logoWidth || null,
        logoHeight: tenant.logoHeight || null,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        headerText: tenant.headerText || null,
        textColor: tenant.textColor || null,
      },
    });
  } catch (error) {
    logger.error('ブランディング情報取得エラー:', error);
    return NextResponse.json({ error: 'ブランディング情報の取得に失敗しました' }, { status: 500 });
  }
}

// ブランディング設定の更新（PUT）
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // リクエストボディの取得
    const body = await req.json();
    const { primaryColor, secondaryColor, logoUrl, logoWidth, logoHeight, headerText, textColor } =
      body;

    // ユーザーとテナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        subscriptionStatus: true,
        adminOfTenant: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 永久利用権ユーザーの場合、Userテーブルに直接保存
    if (user.subscriptionStatus === 'permanent') {
      logger.debug('永久利用権ユーザーのブランディング設定を更新:', user.id);

      try {
        // Userテーブルに直接保存
        const updatedUser = await prisma.user.update({
          where: { id: session.user.id },
          data: {
            mainColor: primaryColor || undefined,
            headerText: headerText || undefined,
            textColor: textColor || undefined,
            // logoUrlはUserテーブルのimageフィールドを使用
            image: logoUrl || undefined,
          },
        });

        logger.debug('永久利用権ユーザーのブランディング設定を保存しました:', {
          userId: updatedUser.id,
          mainColor: updatedUser.mainColor,
          headerText: updatedUser.headerText,
          textColor: updatedUser.textColor,
        });

        return NextResponse.json({
          success: true,
          message: '永久利用権ユーザーのブランディング設定を更新しました',
          tenant: {
            primaryColor: updatedUser.mainColor,
            secondaryColor: updatedUser.mainColor,
            logoUrl: updatedUser.image,
            logoWidth: logoWidth ? Number(logoWidth) : null,
            logoHeight: logoHeight ? Number(logoHeight) : null,
            headerText: updatedUser.headerText,
            textColor: updatedUser.textColor,
          },
        });
      } catch (error) {
        logger.error('永久利用権ユーザーのブランディング設定更新エラー:', error);
        return NextResponse.json(
          { error: '永久利用権ユーザーのブランディング設定の更新に失敗しました' },
          { status: 500 },
        );
      }
    }

    // 管理者権限の確認
    if (!user.adminOfTenant) {
      return NextResponse.json(
        { error: 'ブランディング設定の変更には管理者権限が必要です' },
        { status: 403 },
      );
    }

    // 更新データを準備（明示的な型を使用）
    type UpdateData = {
      primaryColor: string | null;
      secondaryColor: string | null;
      logoUrl: string | null;
      logoWidth?: number;
      logoHeight?: number;
      headerText?: string | null;
      textColor?: string | null;
    };

    const updateData: UpdateData = {
      primaryColor,
      secondaryColor,
      logoUrl,
    };

    // 数値型に変換して保存 (値が存在する場合のみ)
    if (logoWidth !== undefined) {
      updateData.logoWidth = Number(logoWidth);
    }
    if (logoHeight !== undefined) {
      updateData.logoHeight = Number(logoHeight);
    }

    // 追加したフィールドを設定
    if (headerText !== undefined) {
      updateData.headerText = headerText;
    }
    if (textColor !== undefined) {
      updateData.textColor = textColor;
    }

    logger.debug('テナント更新データ:', updateData);

    // テナント情報を更新
    const updatedTenant = await prisma.corporateTenant.update({
      where: { id: user.adminOfTenant.id },
      data: updateData,
    });

    // ブランディング更新後のアクティビティログ
    await logCorporateActivity({
      tenantId: user.adminOfTenant.id,
      userId: session.user.id,
      action: 'update_branding',
      entityType: 'tenant',
      entityId: user.adminOfTenant.id,
      description: 'ブランディング設定を更新しました',
      metadata: {
        updatedFields: Object.keys(updateData),
        previousValues: {
          logoUrl: user.adminOfTenant.logoUrl,
          primaryColor: user.adminOfTenant.primaryColor,
          secondaryColor: user.adminOfTenant.secondaryColor,
          headerText: user.adminOfTenant.headerText,
          textColor: user.adminOfTenant.textColor,
        },
        newValues: {
          primaryColor: updateData.primaryColor,
          secondaryColor: updateData.secondaryColor,
          logoUrl: updateData.logoUrl,
          ...(updateData.logoWidth !== undefined && { logoWidth: updateData.logoWidth }),
          ...(updateData.logoHeight !== undefined && { logoHeight: updateData.logoHeight }),
          ...(updateData.headerText !== undefined && { headerText: updateData.headerText }),
          ...(updateData.textColor !== undefined && { textColor: updateData.textColor }),
        },
      },
    });

    return NextResponse.json({
      success: true,
      tenant: updatedTenant,
    });
  } catch (error) {
    logger.error('ブランディング設定更新エラー:', error);
    return NextResponse.json({ error: 'ブランディング設定の更新に失敗しました' }, { status: 500 });
  }
}