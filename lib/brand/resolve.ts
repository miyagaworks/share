// lib/brand/resolve.ts
// ブランド解決の統一レイヤー
// - 月額型: DBの Partner モデルからブランド情報を取得
// - 買取型: 環境変数から取得（既存の getBrandConfig() と同等）
// - デフォルト: Share 本体のブランド

import { prisma } from '@/lib/prisma';
import { getBrandConfig, type BrandConfig } from './config';

export interface ResolvedBrand {
  name: string;
  logoUrl: string | null;
  logoWidth: number | null;
  logoHeight: number | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string | null;
  companyName: string | null;
  companyAddress: string | null;
  supportEmail: string | null;
  privacyUrl: string | null;
  termsUrl: string | null;
  fromName: string | null;
  fromEmail: string | null;
  appUrl: string;
  partnerId: string | null;
  isPartner: boolean;
  isBuyout: boolean;
}

/**
 * BrandConfig（買取型/デフォルト）を ResolvedBrand に変換
 */
function fromBrandConfig(config: BrandConfig): ResolvedBrand {
  return {
    name: config.name,
    logoUrl: config.logoUrl,
    logoWidth: null,
    logoHeight: null,
    faviconUrl: config.faviconUrl,
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor || null,
    companyName: config.companyName,
    companyAddress: config.companyAddress,
    supportEmail: config.supportEmail,
    privacyUrl: config.privacyUrl,
    termsUrl: config.termsUrl,
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    appUrl: config.appUrl,
    partnerId: null,
    isPartner: false,
    isBuyout: config.isBuyout,
  };
}

/**
 * パートナーIDからブランド情報を解決
 */
export async function resolveBrandByPartnerId(partnerId: string): Promise<ResolvedBrand> {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
  });

  if (!partner || partner.accountStatus === 'suspended') {
    return fromBrandConfig(getBrandConfig());
  }

  const config = getBrandConfig();

  return {
    name: partner.brandName,
    logoUrl: partner.logoUrl,
    logoWidth: partner.logoWidth,
    logoHeight: partner.logoHeight,
    faviconUrl: partner.faviconUrl,
    primaryColor: partner.primaryColor,
    secondaryColor: partner.secondaryColor,
    companyName: partner.companyName,
    companyAddress: partner.companyAddress,
    supportEmail: partner.supportEmail,
    privacyUrl: partner.privacyPolicyUrl,
    termsUrl: partner.termsUrl,
    fromName: partner.emailFromName || partner.brandName,
    fromEmail: partner.emailFromAddress || config.fromEmail,
    appUrl: partner.customDomain
      ? `https://${partner.customDomain}`
      : config.appUrl,
    partnerId: partner.id,
    isPartner: true,
    isBuyout: false,
  };
}

/**
 * ホスト名からブランド情報を解決
 * middleware.ts や Route Handler で使用
 */
export async function resolveBrandByHostname(hostname: string): Promise<ResolvedBrand> {
  const config = getBrandConfig();
  const mainDomain = new URL(config.appUrl).hostname;

  // メインドメインの場合はデフォルトブランド
  if (hostname === mainDomain || hostname.endsWith(`.${mainDomain}`)) {
    return fromBrandConfig(config);
  }

  // カスタムドメインからパートナーを検索
  const partner = await prisma.partner.findUnique({
    where: { customDomain: hostname },
  });

  if (!partner || partner.accountStatus === 'suspended' || !partner.domainVerified) {
    return fromBrandConfig(config);
  }

  return resolveBrandByPartnerId(partner.id);
}

/**
 * ユーザーIDからブランド情報を解決
 * ユーザーの所属パートナーに基づいてブランドを返す
 */
export async function resolveBrandByUserId(userId: string): Promise<ResolvedBrand> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      partnerId: true,
      tenantId: true,
    },
  });

  if (!user) {
    return fromBrandConfig(getBrandConfig());
  }

  // ユーザーが直接パートナーに紐づいている場合
  if (user.partnerId) {
    return resolveBrandByPartnerId(user.partnerId);
  }

  // テナント経由でパートナーを検索
  if (user.tenantId) {
    const tenant = await prisma.corporateTenant.findUnique({
      where: { id: user.tenantId },
      select: { partnerId: true },
    });
    if (tenant?.partnerId) {
      return resolveBrandByPartnerId(tenant.partnerId);
    }
  }

  // パートナー未所属 → デフォルトブランド
  return fromBrandConfig(getBrandConfig());
}

/**
 * デフォルトのブランド情報を取得（同期的）
 * getBrandConfig() のラッパー
 */
export function getDefaultBrand(): ResolvedBrand {
  return fromBrandConfig(getBrandConfig());
}
