// app/api/partner/branding/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

// パートナーブランディング設定の取得（GET）
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // パートナー管理者かチェック
    const partner = await prisma.partner.findUnique({
      where: { adminUserId: session.user.id },
    });

    if (!partner) {
      return NextResponse.json({ error: 'パートナー情報が見つかりません' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      branding: {
        brandName: partner.brandName,
        logoUrl: partner.logoUrl,
        logoWidth: partner.logoWidth,
        logoHeight: partner.logoHeight,
        faviconUrl: partner.faviconUrl,
        primaryColor: partner.primaryColor,
        secondaryColor: partner.secondaryColor,
        customDomain: partner.customDomain,
        domainVerified: partner.domainVerified,
        companyName: partner.companyName,
        companyAddress: partner.companyAddress,
        privacyPolicyUrl: partner.privacyPolicyUrl,
        termsUrl: partner.termsUrl,
        emailFromName: partner.emailFromName,
        supportEmail: partner.supportEmail,
      },
    });
  } catch (error) {
    logger.error('パートナーブランディング取得エラー:', error);
    return NextResponse.json(
      { error: 'ブランディング情報の取得に失敗しました' },
      { status: 500 },
    );
  }
}

// パートナーブランディング設定の更新（PUT）
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // パートナー管理者かチェック
    const partner = await prisma.partner.findUnique({
      where: { adminUserId: session.user.id },
    });

    if (!partner) {
      return NextResponse.json({ error: 'パートナー情報が見つかりません' }, { status: 404 });
    }

    const body = await req.json();
    const {
      brandName,
      logoUrl,
      logoWidth,
      logoHeight,
      faviconUrl,
      primaryColor,
      secondaryColor,
      companyName,
      companyAddress,
      privacyPolicyUrl,
      termsUrl,
      emailFromName,
      supportEmail,
    } = body;

    // 更新データを構築
    const updateData: Record<string, unknown> = {};
    if (brandName !== undefined) updateData.brandName = brandName;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (logoWidth !== undefined) updateData.logoWidth = logoWidth ? Number(logoWidth) : null;
    if (logoHeight !== undefined) updateData.logoHeight = logoHeight ? Number(logoHeight) : null;
    if (faviconUrl !== undefined) updateData.faviconUrl = faviconUrl;
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (companyAddress !== undefined) updateData.companyAddress = companyAddress;
    if (privacyPolicyUrl !== undefined) updateData.privacyPolicyUrl = privacyPolicyUrl;
    if (termsUrl !== undefined) updateData.termsUrl = termsUrl;
    if (emailFromName !== undefined) updateData.emailFromName = emailFromName;
    if (supportEmail !== undefined) updateData.supportEmail = supportEmail;

    const updatedPartner = await prisma.partner.update({
      where: { id: partner.id },
      data: updateData,
    });

    // アクティビティログ
    await prisma.partnerActivityLog.create({
      data: {
        partnerId: partner.id,
        userId: session.user.id,
        action: 'update_branding',
        entityType: 'partner',
        entityId: partner.id,
        description: 'ブランディング設定を更新しました',
        metadata: {
          updatedFields: Object.keys(updateData),
        },
      },
    });

    return NextResponse.json({
      success: true,
      branding: {
        brandName: updatedPartner.brandName,
        logoUrl: updatedPartner.logoUrl,
        logoWidth: updatedPartner.logoWidth,
        logoHeight: updatedPartner.logoHeight,
        faviconUrl: updatedPartner.faviconUrl,
        primaryColor: updatedPartner.primaryColor,
        secondaryColor: updatedPartner.secondaryColor,
        customDomain: updatedPartner.customDomain,
        domainVerified: updatedPartner.domainVerified,
        companyName: updatedPartner.companyName,
        companyAddress: updatedPartner.companyAddress,
        privacyPolicyUrl: updatedPartner.privacyPolicyUrl,
        termsUrl: updatedPartner.termsUrl,
        emailFromName: updatedPartner.emailFromName,
        supportEmail: updatedPartner.supportEmail,
      },
    });
  } catch (error) {
    logger.error('パートナーブランディング更新エラー:', error);
    return NextResponse.json(
      { error: 'ブランディング設定の更新に失敗しました' },
      { status: 500 },
    );
  }
}
