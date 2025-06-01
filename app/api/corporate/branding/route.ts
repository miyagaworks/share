// app/api/corporate/branding/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logCorporateActivity } from '@/lib/utils/activity-logger';
import { generateVirtualTenantData } from '@/lib/corporateAccess';
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
        subscriptionStatus: true, // 永久利用権ユーザー判定用
        adminOfTenant: true,
        tenant: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    // 永久利用権ユーザーの場合、仮想テナントのブランディング情報を返す
    if (user.subscriptionStatus === 'permanent') {
      logger.debug('永久利用権ユーザー用仮想ブランディング情報の生成:', user.id);
      const virtualTenant = generateVirtualTenantData(user.id, user.name);
      return NextResponse.json({
        success: true,
        branding: {
          logoUrl: virtualTenant.settings.logoUrl,
          logoWidth: null,
          logoHeight: null,
          primaryColor: virtualTenant.settings.primaryColor,
          secondaryColor: virtualTenant.settings.secondaryColor,
          headerText: null,
          textColor: null,
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
        headerText: tenant.headerText || null, // 追加
        textColor: tenant.textColor || null, // 追加
      },
    });
  } catch (error) {
    logger.error('ブランディング情報取得エラー:', error);
    return NextResponse.json({ error: 'ブランディング情報の取得に失敗しました' }, { status: 500 });
  }
}
// app/api/corporate/branding/route.ts の PUT メソッド修正
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    // リクエストボディの取得
    const body = await req.json();
    const {
      primaryColor,
      secondaryColor,
      logoUrl,
      logoWidth,
      logoHeight,
      headerText, // 追加
      textColor, // 追加
    } = body;
    // ユーザーとテナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        subscriptionStatus: true, // 永久利用権ユーザー判定用
        adminOfTenant: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    // 永久利用権ユーザーの場合、仮想テナントの設定を更新（ローカルストレージに保存）
    if (user.subscriptionStatus === 'permanent') {
      logger.debug('永久利用権ユーザーの仮想ブランディング設定は更新できません');
      // 更新はサポートせず、成功レスポンスを返す
      return NextResponse.json({
        success: true,
        message: '永久利用権ユーザーの仮想ブランディング設定は更新されません',
        tenant: {
          primaryColor,
          secondaryColor,
          logoUrl,
          // 表示のみのために他のフィールドも含める
          logoWidth: logoWidth ? Number(logoWidth) : null,
          logoHeight: logoHeight ? Number(logoHeight) : null,
          headerText,
          textColor,
        },
      });
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
      headerText?: string | null; // 追加
      textColor?: string | null; // 追加
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
          // 明示的に各プロパティを追加
          primaryColor: updateData.primaryColor,
          secondaryColor: updateData.secondaryColor,
          logoUrl: updateData.logoUrl,
          // 省略可能なプロパティは条件付きで追加
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