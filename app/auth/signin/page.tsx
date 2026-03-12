// app/auth/signin/page.tsx (Server Component - パートナーブランド解決)
import { headers } from 'next/headers';
import { getBrandConfig } from '@/lib/brand/config';
import { resolveBrandByPartnerId, resolveBrandByHostname } from '@/lib/brand/resolve';
import SigninClient, { type SigninBrandProps } from './SigninClient';

export default async function SigninPage() {
  const brand = await resolveSigninBrand();
  return <SigninClient brand={brand} />;
}

async function resolveSigninBrand(): Promise<SigninBrandProps> {
  const defaultConfig = getBrandConfig();
  const defaultBrand: SigninBrandProps = {
    brandName: defaultConfig.name,
    tagline: defaultConfig.tagline,
    logoUrl: defaultConfig.logoUrl,
    logoWidth: null,
    logoHeight: null,
    primaryColor: defaultConfig.primaryColor,
    isPartner: false,
    isBuyout: defaultConfig.isBuyout,
  };

  try {
    const headersList = await headers();

    // middleware がセットした x-partner-id を優先的に使用
    const partnerId = headersList.get('x-partner-id');
    if (partnerId) {
      const resolved = await resolveBrandByPartnerId(partnerId);
      if (resolved.isPartner) {
        return {
          brandName: resolved.name,
          tagline: defaultConfig.tagline,
          logoUrl: resolved.logoUrl,
          logoWidth: resolved.logoWidth,
          logoHeight: resolved.logoHeight,
          primaryColor: resolved.primaryColor,
          isPartner: true,
          isBuyout: false,
        };
      }
    }

    // フォールバック: host ベースで解決
    const host = headersList.get('host');
    if (host) {
      const resolved = await resolveBrandByHostname(host);
      if (resolved.isPartner) {
        return {
          brandName: resolved.name,
          tagline: defaultConfig.tagline,
          logoUrl: resolved.logoUrl,
          logoWidth: resolved.logoWidth,
          logoHeight: resolved.logoHeight,
          primaryColor: resolved.primaryColor,
          isPartner: true,
          isBuyout: false,
        };
      }
    }
  } catch {
    // フォールバック: デフォルトブランド
  }

  return defaultBrand;
}
